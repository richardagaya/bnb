"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function LoginForm() {
  const { user, isReady, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (user) router.replace(redirect);
  }, [user, isReady, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await signIn(email, password, name || undefined);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
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

  return (
    <div className="login-shell">
      <div className="login-card">
        <Link href="/" className="login-logo">
          <span className="login-logo-mark">H</span>
          HostLedger
        </Link>
        <h1 className="login-title">Sign in</h1>
        <p className="login-sub">
          Use any valid email and a password of at least 8 characters (demo).
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Display name <span className="login-optional">optional</span>
            <input
              className="login-input"
              type="text"
              autoComplete="name"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
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
          <label className="login-label">
            Password
            <input
              className="login-input"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="login-submit" disabled={pending}>
            {pending ? "Signing in…" : "Continue to dashboard"}
          </button>
        </form>

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
  .login-optional {
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    color: #4a5068;
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
  .login-back {
    display: block;
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: #4a5068;
    text-decoration: none;
  }
  .login-back:hover {
    color: #81b29a;
  }
`;
