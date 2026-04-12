"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";

const STORAGE_KEY = "hostledger-auth";

export type User = { email: string; name: string };

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  signIn: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw) as User);
      } catch {
        /* ignore */
      }
      setIsReady(true);
    });
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, name?: string) => {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return { ok: false as const, error: "Enter a valid email." };
      }
      if (password.length < 8) {
        return {
          ok: false as const,
          error: "Password must be at least 8 characters.",
        };
      }
      const displayName =
        name?.trim() || trimmed.split("@")[0] || "Host";
      const next: User = { email: trimmed, name: displayName };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUser(next);
      return { ok: true as const };
    },
    []
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isReady, signIn, signOut }),
    [user, isReady, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
