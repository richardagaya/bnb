"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "sign-in" | "sign-up" | "reset";

function LoginForm() {
  const { user, isReady, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (user) router.replace(redirect);
  }, [user, isReady, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    if (mode === "reset") {
      const result = await resetPassword(email);
      setPending(false);
      if (!result.ok) {
        setError(result.error);
      } else {
        setInfo("Password reset email sent — check your inbox.");
        setMode("sign-in");
      }
      return;
    }

    const result =
      mode === "sign-up"
        ? await signUp(email, password, name)
        : await signIn(email, password);

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(redirect);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleGoogle = async () => {
    setError(null);
    setGooglePending(true);
    const result = await signInWithGoogle();
    setGooglePending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(redirect);
  };

  if (!isReady) {
    return (
      <div className="login-shell">
        <p className="login-muted">Loading…</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (user) return null;

  const title =
    mode === "sign-up" ? "Create account" : mode === "reset" ? "Reset password" : "Sign in";

  const submitLabel =
    mode === "sign-up"
      ? "Create account"
      : mode === "reset"
      ? "Send reset email"
      : "Sign in";

  return (
    <div className="login-shell">
      <div className="login-card">
        <Link href="/" className="login-logo">
          <span className="login-logo-mark">H</span>
          HostLedger
        </Link>

        <h1 className="login-title">{title}</h1>

        {mode === "sign-in" && (
          <p className="login-sub">
            Sign in to your HostLedger account.
          </p>
        )}
        {mode === "sign-up" && (
          <p className="login-sub">
            Create a free account to start tracking your properties.
          </p>
        )}
        {mode === "reset" && (
          <p className="login-sub">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {mode === "sign-up" && (
            <label className="login-label">
              Display name
              <input
                className="login-input"
                type="text"
                autoComplete="name"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}

          <label className="login-label">
            Email
            <input
              className="login-input"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {mode !== "reset" && (
            <label className="login-label">
              Password
              <input
                className="login-input"
                type="password"
                required
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}

          {error && <p className="login-error">{error}</p>}
          {info && <p className="login-info">{info}</p>}

          <button type="submit" className="login-submit" disabled={pending}>
            {pending ? "Please wait…" : submitLabel}
          </button>
        </form>

        {mode !== "reset" && (
          <>
            <div className="login-divider">
              <span>or</span>
            </div>
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogle}
              disabled={googlePending || pending}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              {googlePending ? "Signing in…" : "Continue with Google"}
            </button>
          </>
        )}

        <div className="login-footer">
          {mode === "sign-in" && (
            <>
              <button className="login-link-btn" onClick={() => switchMode("reset")}>
                Forgot password?
              </button>
              <span className="login-sep">·</span>
              <button className="login-link-btn" onClick={() => switchMode("sign-up")}>
                Create account
              </button>
            </>
          )}
          {mode === "sign-up" && (
            <>
              Already have an account?{" "}
              <button className="login-link-btn" onClick={() => switchMode("sign-in")}>
                Sign in
              </button>
            </>
          )}
          {mode === "reset" && (
            <button className="login-link-btn" onClick={() => switchMode("sign-in")}>
              ← Back to sign in
            </button>
          )}
        </div>

        <Link href="/" className="login-back">
          ← Back to home
        </Link>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-shell login-shell--fallback">
          <p className="login-muted">Loading…</p>
          <style jsx>{styles}</style>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

const styles = `
  .login-shell {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #0c0e14;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .login-shell--fallback {
    color: #4a5068;
    font-size: 14px;
  }
  .login-muted {
    color: #4a5068;
    font-size: 14px;
  }
  .login-card {
    width: 100%;
    max-width: 400px;
    padding: 36px 32px;
    background: #12151e;
    border: 1px solid #1e2130;
    border-radius: 16px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
  }
  .login-logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 700;
    color: #e8e3d9;
    text-decoration: none;
    margin-bottom: 28px;
  }
  .login-logo-mark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #81b29a, #3d405b);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #fff;
  }
  .login-title {
    font-size: 24px;
    font-weight: 700;
    color: #e8e3d9;
    margin: 0 0 8px;
    letter-spacing: -0.02em;
  }
  .login-sub {
    font-size: 13px;
    color: #4a5068;
    line-height: 1.5;
    margin: 0 0 24px;
  }
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .login-label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #8a8f9e;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .login-input {
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid #2a3050;
    background: #0c0e14;
    color: #e8e3d9;
    font-size: 15px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }
  .login-input:focus {
    border-color: #81b29a;
  }
  .login-input::placeholder {
    color: #4a5068;
  }
  .login-error {
    font-size: 13px;
    color: #e07a5f;
    margin: -4px 0 0;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }
  .login-info {
    font-size: 13px;
    color: #81b29a;
    margin: -4px 0 0;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }
  .login-submit {
    margin-top: 8px;
    padding: 14px 18px;
    border: none;
    border-radius: 10px;
    background: #81b29a;
    color: #0f1117;
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }
  .login-submit:hover:not(:disabled) {
    opacity: 0.92;
  }
  .login-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .login-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 20px;
    font-size: 13px;
    color: #4a5068;
  }
  .login-sep {
    color: #2a3050;
  }
  .login-link-btn {
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
    color: #81b29a;
    cursor: pointer;
    font-family: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .login-link-btn:hover {
    opacity: 0.8;
  }
  .login-back {
    display: block;
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
    color: #4a5068;
    text-decoration: none;
  }
  .login-back:hover {
    color: #81b29a;
  }
  .login-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0 0;
    color: #2a3050;
    font-size: 12px;
  }
  .login-divider::before,
  .login-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #1e2130;
  }
  .login-divider span {
    color: #4a5068;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    margin-top: 12px;
    padding: 13px 18px;
    border: 1px solid #2a3050;
    border-radius: 10px;
    background: #12151e;
    color: #e8e3d9;
    font-size: 15px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .google-btn:hover:not(:disabled) {
    border-color: #4285F4;
    background: #161924;
  }
  .google-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
