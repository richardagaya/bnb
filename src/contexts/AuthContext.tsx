"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  updateProfile,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile, getUserProfile, updateUserProfile, type UserProfile } from "@/lib/firestore";
import { DEFAULT_CURRENCY } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  currency: string;
};

type SignInResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, name: string) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<SignInResult>;
  /** Persist a new account-wide display currency (ISO 4217 code). */
  updateCurrency: (code: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapFirebaseUser(fbUser: FirebaseUser, profile?: UserProfile | null): User {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? "",
    name: profile?.name ?? fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "Host",
    photoURL: profile?.photoURL ?? fbUser.photoURL ?? undefined,
    currency: profile?.currency ?? DEFAULT_CURRENCY,
  };
}

function friendlyError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function sendWelcomeEmail(email: string, name: string) {
  if (!email) return;

  try {
    const response = await fetch("/api/send-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      console.error("[auth] Welcome email failed:", response.status);
    }
  } catch (err) {
    console.error("[auth] Welcome email request failed:", err);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Unblock the UI immediately using Auth data (cached locally by Firebase SDK)
        setUser(mapFirebaseUser(fbUser, null));
        setIsReady(true);

        // Enrich silently in the background with any extra Firestore profile fields
        getUserProfile(fbUser.uid)
          .then((profile) => {
            if (profile) setUser(mapFirebaseUser(fbUser, profile));
          })
          .catch(() => undefined);
      } else {
        setUser(null);
        setIsReady(true);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged fires immediately after and sets the user — no extra fetch needed
      return { ok: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      return { ok: false, error: friendlyError(code) };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<SignInResult> => {
    try {
      const trimmedEmail = email.trim();
      const displayName = name.trim() || trimmedEmail.split("@")[0];

      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      // Set Firebase Auth display name
      await updateProfile(cred.user, { displayName });

      // Persist full profile in Firestore
      await createUserProfile({
        uid: cred.user.uid,
        email: trimmedEmail,
        name: displayName,
      });

      setUser(mapFirebaseUser(cred.user, { uid: cred.user.uid, email: trimmedEmail, name: displayName }));

      // Wait before redirecting so the browser does not cancel the request.
      await sendWelcomeEmail(trimmedEmail, displayName);

      return { ok: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      return { ok: false, error: friendlyError(code) };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<SignInResult> => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const email = cred.user.email ?? "";
      const name = cred.user.displayName ?? email.split("@")[0] ?? "Host";

      // Create Firestore profile on first sign-in without blocking Google auth.
      getUserProfile(cred.user.uid)
        .then((existing) => {
          if (!existing) {
            return createUserProfile({
              uid: cred.user.uid,
              email,
              name,
              photoURL: cred.user.photoURL ?? undefined,
            });
          }
        })
        .catch(() => undefined);

      if (getAdditionalUserInfo(cred)?.isNewUser) {
        await sendWelcomeEmail(email, name);
      }

      // onAuthStateChanged fires immediately and sets the user
      return { ok: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return { ok: false, error: "Sign-in was cancelled." };
      }
      return { ok: false, error: friendlyError(code) };
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const updateCurrency = useCallback(async (code: string) => {
    // Optimistically update local state so formatting changes immediately.
    setUser((prev) => (prev ? { ...prev, currency: code } : prev));
    const uid = auth.currentUser?.uid;
    if (uid) await updateUserProfile(uid, { currency: code });
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<SignInResult> => {
    try {
      const response = await fetch("/api/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        return { ok: false, error: data.error ?? "Failed to send reset email." };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to send reset email. Please try again." };
    }
  }, []);

  const value = useMemo(
    () => ({ user, isReady, signIn, signUp, signInWithGoogle, signOut, resetPassword, updateCurrency }),
    [user, isReady, signIn, signUp, signInWithGoogle, signOut, resetPassword, updateCurrency]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
