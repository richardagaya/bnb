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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (user) router.replace(redirect);
  }, [user, isReady, router, redirect]);

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      setMode("reset");
    }
  }, [searchParams]);

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
      <div className="auth-shell">
        <span className="auth-spinner" />
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (user) return null;

  const heading =
    mode === "sign-up" ? "Create your account" :
    mode === "reset"   ? "Reset your password" :
                         "Welcome back";

  const sub =
    mode === "sign-up" ? "Start tracking your properties for free." :
    mode === "reset"   ? "We'll send a reset link to your email." :
                         "Sign in to continue to Tracktar.";

  const submitLabel =
    mode === "sign-up" ? "Create account" :
    mode === "reset"   ? "Send reset link" :
                         "Sign in";

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <img src="/logo.png" alt="Tracktar" className="auth-brand-logo" />
        </Link>

        <h1 className="auth-heading">{heading}</h1>
        <p className="auth-sub">{sub}</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === "sign-up" && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                className="auth-input"
                type="text"
                autoComplete="name"
                placeholder="Alex Kamau"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="auth-input"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode !== "reset" && (
            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="auth-password">Password</label>
                {mode === "sign-in" && (
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => switchMode("reset")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="auth-input-wrap">
                <input
                  id="auth-password"
                  className="auth-input auth-input-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-show"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}
          {info && <div className="auth-alert auth-alert-info" role="status">{info}</div>}

          <button type="submit" className="auth-submit" disabled={pending}>
            {pending ? `${submitLabel}…` : submitLabel}
          </button>
        </form>

        {mode !== "reset" && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <button
              type="button"
              className="auth-google"
              onClick={handleGoogle}
              disabled={googlePending || pending}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              {googlePending ? "Signing in…" : "Continue with Google"}
            </button>
          </>
        )}

        <p className="auth-switch">
          {mode === "sign-in" && (
            <>
              Don&apos;t have an account?{" "}
              <button type="button" className="auth-link-btn" onClick={() => switchMode("sign-up")}>
                Sign up
              </button>
            </>
          )}
          {mode === "sign-up" && (
            <>
              Already have an account?{" "}
              <button type="button" className="auth-link-btn" onClick={() => switchMode("sign-in")}>
                Sign in
              </button>
            </>
          )}
          {mode === "reset" && (
            <button type="button" className="auth-link-btn" onClick={() => switchMode("sign-in")}>
              ← Back to sign in
            </button>
          )}
        </p>

        <p className="auth-terms">
          By continuing, you agree to our{" "}
          <Link href="/terms-of-service" className="auth-terms-link">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="auth-terms-link">Privacy Policy</Link>.
        </p>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <span className="auth-spinner" />
          <style jsx>{styles}</style>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .auth-shell {
    --bg: #0b0c10;
    --card: #111318;
    --bd: rgba(255,255,255,0.08);
    --text: #e8e6df;
    --muted: #7a7d8a;
    --sage: #81B29A;
    --coral: #E07A5F;
    --serif: 'Instrument Serif', Georgia, serif;
    --sans: 'Geist', system-ui, sans-serif;

    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: var(--bg);
    font-family: var(--sans);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  .auth-spinner {
    width: 28px; height: 28px;
    border: 2.5px solid var(--bd);
    border-top-color: var(--sage);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .auth-card {
    width: 100%;
    max-width: 400px;
    padding: 32px 28px 24px;
    border: 1px solid var(--bd);
    border-radius: 16px;
    background: var(--card);
  }

  .auth-brand {
    display: inline-flex;
    margin-bottom: 24px;
  }
  .auth-brand-logo {
    height: 40px;
    width: auto;
    display: block;
    filter: brightness(0) invert(1);
  }

  .auth-heading {
    font-family: var(--serif);
    font-size: 28px;
    font-weight: 400;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
  }
  .auth-sub {
    font-size: 14px;
    color: var(--muted);
    margin: 0 0 24px;
    line-height: 1.5;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .auth-label {
    font-size: 13px;
    font-weight: 500;
    color: #a8abb6;
  }

  .auth-input-wrap { position: relative; display: flex; align-items: center; }
  .auth-input {
    width: 100%;
    padding: 12px 14px;
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--bd);
    border-radius: 10px;
    color: var(--text);
    font-size: 15px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .auth-input:focus-visible {
    border-color: var(--sage);
    box-shadow: 0 0 0 3px rgba(129,178,154,0.15);
  }
  .auth-input::placeholder { color: #5a5d68; }
  .auth-input-password { padding-right: 60px; }
  .auth-show {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    padding: 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    cursor: pointer;
    font-family: inherit;
  }
  .auth-show:hover { color: var(--sage); }

  .auth-link-btn {
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
    color: var(--sage);
    cursor: pointer;
    font-family: inherit;
  }
  .auth-link-btn:hover { text-decoration: underline; text-underline-offset: 2px; }

  .auth-alert {
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
  }
  .auth-alert-error { background: rgba(224,122,95,0.08); border: 1px solid rgba(224,122,95,0.25); color: var(--coral); }
  .auth-alert-info  { background: rgba(129,178,154,0.08); border: 1px solid rgba(129,178,154,0.25); color: var(--sage); }

  .auth-submit {
    padding: 13px 16px;
    border: none;
    border-radius: 10px;
    background: var(--sage);
    color: #0b0c10;
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .auth-submit:hover:not(:disabled) { opacity: 0.9; }
  .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 0;
    color: var(--muted);
    font-size: 12px;
  }
  .auth-divider::before, .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--bd);
  }

  .auth-google {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--bd);
    border-radius: 10px;
    background: transparent;
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }
  .auth-google:hover:not(:disabled) { background: rgba(255,255,255,0.04); }
  .auth-google:disabled { opacity: 0.5; cursor: not-allowed; }

  .auth-switch {
    text-align: center;
    font-size: 13px;
    color: var(--muted);
    margin: 20px 0 16px;
  }

  .auth-terms {
    font-size: 12px;
    color: var(--muted);
    text-align: center;
    margin: 0;
    line-height: 1.6;
  }
  .auth-terms-link { color: #a8abb6; text-decoration: underline; text-underline-offset: 2px; }
  .auth-terms-link:hover { color: var(--sage); }

  .auth-link-btn:focus-visible,
  .auth-show:focus-visible {
    outline: 2px solid var(--sage);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (max-width: 480px) {
    .auth-card { padding: 24px 20px 20px; }
    .auth-heading { font-size: 24px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .auth-spinner { animation: none; }
  }
`;