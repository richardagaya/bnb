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
                         "Sign in to continue to Tractar.";

  const submitLabel =
    mode === "sign-up" ? "Create account" :
    mode === "reset"   ? "Send reset link" :
                         "Sign in";

  return (
    <div className="auth-shell">
      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <Link href="/" className="auth-brand">
            <img src="/logo.png" alt="Tractar" className="auth-brand-logo" />
          </Link>

          <div className="auth-left-body">
            <p className="auth-left-eyebrow">Property Management</p>
            <h2 className="auth-left-heading">
              Your rentals.<br />Your numbers.<br />Your control.
            </h2>
            <p className="auth-left-desc">
              Track bookings, expenses, referrals, and profit across all your properties — in one clean dashboard.
            </p>

            <ul className="auth-features">
              <li className="auth-feature">
                <span className="auth-feature-icon">📋</span>
                <span>Booking & guest tracking</span>
              </li>
              <li className="auth-feature">
                <span className="auth-feature-icon">📈</span>
                <span>Monthly P&amp;L history</span>
              </li>
              <li className="auth-feature">
                <span className="auth-feature-icon">🤝</span>
                <span>Referral commission tracking</span>
              </li>
              <li className="auth-feature">
                <span className="auth-feature-icon">🧾</span>
                <span>Expense management</span>
              </li>
            </ul>
          </div>

          <p className="auth-left-footer">© 2026 Tractar</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <Link href="/" className="auth-home-link">
            ← Back to home
          </Link>

          {/* Mobile-only brand */}
          <Link href="/" className="auth-brand auth-brand-mobile">
            <img src="/logo.png" alt="Tractar" className="auth-brand-logo" />
          </Link>

          {/* Mode tabs (sign-in / sign-up only) */}
          {mode !== "reset" && (
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === "sign-in" ? "active" : ""}`}
                onClick={() => switchMode("sign-in")}
              >
                Sign in
              </button>
              <button
                className={`auth-tab ${mode === "sign-up" ? "active" : ""}`}
                onClick={() => switchMode("sign-up")}
              >
                Sign up
              </button>
            </div>
          )}

          <div className="auth-heading-block">
            <h1 className="auth-heading">{heading}</h1>
            <p className="auth-sub">{sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {mode === "sign-up" && (
              <div className="auth-field">
                <label className="auth-label">Your name</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    className="auth-input"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Kamau"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  className="auth-input"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {mode !== "reset" && (
              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label">Password</label>
                  {mode === "sign-in" && (
                    <button
                      type="button"
                      className="auth-forgot"
                      onClick={() => switchMode("reset")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
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
                    className="auth-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-alert auth-alert-error">
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}
            {info && (
              <div className="auth-alert auth-alert-info">
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {info}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={pending}>
              {pending ? (
                <><span className="auth-btn-spinner" />{submitLabel}…</>
              ) : submitLabel}
            </button>
          </form>

          {mode !== "reset" && (
            <>
              <div className="auth-divider"><span>or continue with</span></div>
              <button
                type="button"
                className="auth-google"
                onClick={handleGoogle}
                disabled={googlePending || pending}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                {googlePending ? "Signing in…" : "Google"}
              </button>
            </>
          )}

          {mode === "reset" && (
            <button className="auth-back-btn" onClick={() => switchMode("sign-in")}>
              ← Back to sign in
            </button>
          )}

          <p className="auth-terms">
            By continuing, you agree to our{" "}
            <Link href="/terms-of-service" className="auth-terms-link">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="auth-terms-link">Privacy Policy</Link>.
          </p>
        </div>
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
  *, *::before, *::after { box-sizing: border-box; }

  .auth-shell {
    min-height: 100vh;
    display: flex;
    background: #0c0e14;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  /* ── Spinner ── */
  .auth-spinner {
    width: 28px; height: 28px;
    border: 2.5px solid #1e2130;
    border-top-color: #81b29a;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin: auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Left panel ── */
  .auth-left {
    display: none;
    width: 44%;
    flex-shrink: 0;
    background: #0f1219;
    border-right: 1px solid #1a1f2e;
    position: relative;
    overflow: hidden;
  }
  .auth-left::before {
    content: '';
    position: absolute;
    top: -120px; left: -120px;
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(129,178,154,0.10) 0%, transparent 70%);
    pointer-events: none;
  }
  .auth-left::after {
    content: '';
    position: absolute;
    bottom: -80px; right: -80px;
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(61,64,91,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .auth-left-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 40px 44px;
  }
  .auth-left-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 0;
  }
  .auth-left-eyebrow {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #81b29a;
    margin: 0 0 16px;
  }
  .auth-left-heading {
    font-size: 36px;
    font-weight: 800;
    color: #e8e3d9;
    line-height: 1.18;
    margin: 0 0 18px;
    letter-spacing: -0.03em;
  }
  .auth-left-desc {
    font-size: 14px;
    color: #5a6080;
    line-height: 1.65;
    margin: 0 0 36px;
    max-width: 320px;
  }
  .auth-features {
    list-style: none;
    padding: 0; margin: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .auth-feature {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #8a91a8;
  }
  .auth-feature-icon {
    width: 32px; height: 32px;
    background: #161924;
    border: 1px solid #1e2130;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
  }
  .auth-left-footer {
    font-size: 12px;
    color: #2a3050;
    margin: 0;
  }

  /* ── Right panel ── */
  .auth-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    overflow-y: auto;
  }
  .auth-form-wrap {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .auth-home-link {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 500;
    color: #4a5068;
    text-decoration: none;
    transition: color 0.15s;
  }
  .auth-home-link:hover { color: #81b29a; }

  /* ── Brand ── */
  .auth-brand {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    margin-bottom: 36px;
  }
  .auth-brand-mobile { display: none; }
  .auth-brand-logo {
    height: 52px;
    width: auto;
    display: block;
    filter: brightness(0) invert(1);
  }

  /* ── Tabs ── */
  .auth-tabs {
    display: flex;
    background: #0c0e14;
    border: 1px solid #1e2130;
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 28px;
    gap: 2px;
  }
  .auth-tab {
    flex: 1;
    padding: 9px 16px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #4a5068;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.18s;
  }
  .auth-tab.active {
    background: #161924;
    color: #e8e3d9;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .auth-tab:not(.active):hover { color: #8a91a8; }

  /* ── Heading block ── */
  .auth-heading-block { margin-bottom: 28px; }
  .auth-heading {
    font-size: 26px;
    font-weight: 800;
    color: #e8e3d9;
    margin: 0 0 6px;
    letter-spacing: -0.025em;
  }
  .auth-sub {
    font-size: 14px;
    color: #4a5068;
    margin: 0;
    line-height: 1.5;
  }

  /* ── Form ── */
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 20px;
  }
  .auth-field { display: flex; flex-direction: column; gap: 7px; }
  .auth-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .auth-label {
    font-size: 12px;
    font-weight: 600;
    color: #8a91a8;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  .auth-forgot {
    background: none; border: none; padding: 0;
    font-size: 12px; color: #81b29a;
    cursor: pointer; font-family: inherit;
    transition: opacity 0.15s;
  }
  .auth-forgot:hover { opacity: 0.75; }

  .auth-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .auth-input-icon {
    position: absolute;
    left: 13px;
    color: #3a4060;
    width: 17px; height: 17px;
    pointer-events: none;
    flex-shrink: 0;
  }
  .auth-input {
    width: 100%;
    padding: 13px 14px 13px 40px;
    background: #0c0e14;
    border: 1.5px solid #1e2130;
    border-radius: 10px;
    color: #e8e3d9;
    font-size: 15px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .auth-input:focus-visible {
    border-color: #81b29a;
    box-shadow: 0 0 0 3px rgba(129,178,154,0.10);
    outline: none;
  }
  .auth-input::placeholder { color: #5a6080; }
  .auth-input-password { padding-right: 42px; }
  .auth-eye {
    position: absolute; right: 13px;
    background: none; border: none; padding: 0;
    color: #3a4060; cursor: pointer;
    display: flex; align-items: center;
    transition: color 0.15s;
  }
  .auth-eye:hover { color: #81b29a; }
  .auth-eye:focus-visible { color: #81b29a; outline: 2px solid #81b29a; outline-offset: 2px; border-radius: 4px; }

  /* ── Alerts ── */
  .auth-alert {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.45;
    margin-top: -4px;
  }
  .auth-alert-error { background: #1a0e0c; border: 1px solid #e07a5f33; color: #e07a5f; }
  .auth-alert-info  { background: #0c1610; border: 1px solid #81b29a33; color: #81b29a; }

  /* ── Submit ── */
  .auth-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 18px;
    border: none;
    border-radius: 10px;
    background: #81b29a;
    color: #0c0e14;
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    margin-top: 2px;
  }
  .auth-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .auth-submit:active:not(:disabled) { transform: translateY(0); }
  .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-btn-spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(12,14,20,0.3);
    border-top-color: #0c0e14;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ── Divider ── */
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 4px 0 16px;
    color: #2a3050;
    font-size: 11px;
  }
  .auth-divider::before, .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #1a1f2e;
  }
  .auth-divider span {
    color: #5a6080;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  /* ── Google button ── */
  .auth-google {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 13px 18px;
    border: 1.5px solid #1e2130;
    border-radius: 10px;
    background: #0c0e14;
    color: #c8c3b8;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    margin-bottom: 24px;
  }
  .auth-google:hover:not(:disabled) {
    border-color: #4285F4;
    background: #0e1118;
  }
  .auth-google:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Back button (reset mode) ── */
  .auth-back-btn {
    background: none; border: none; padding: 0;
    font-size: 13px; color: #81b29a;
    cursor: pointer; font-family: inherit;
    margin: 8px 0 24px;
    transition: opacity 0.15s;
  }
  .auth-back-btn:hover { opacity: 0.75; }

  /* ── Terms ── */
  .auth-terms {
    font-size: 12px;
    color: #5a6080;
    text-align: center;
    margin: 0;
    line-height: 1.6;
  }
  .auth-terms-link { color: #8a91a8; text-decoration: underline; text-underline-offset: 2px; }
  .auth-terms-link:hover { color: #81b29a; }
  .auth-tab:focus-visible,
  .auth-forgot:focus-visible,
  .auth-back-btn:focus-visible,
  .auth-home-link:focus-visible {
    outline: 2px solid #81b29a;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* ── Desktop: show left panel ── */
  @media (min-width: 820px) {
    .auth-left { display: flex; flex-direction: column; }
    .auth-brand { display: none; }
    .auth-brand-mobile { display: none !important; }
  }

  /* ── Mobile ── */
  @media (max-width: 819px) {
    .auth-right { padding: 28px 20px 40px; }
    .auth-brand-mobile { display: inline-flex; }
    .auth-left { display: none; }
    .auth-heading { font-size: 22px; }
  }
`;
