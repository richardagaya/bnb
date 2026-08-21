"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "sign-in" | "sign-up" | "reset";

const PREVIEW_MONTHS = [
  { month: "Apr", revenue: 9800, profit: 3900 },
  { month: "Mar", revenue: 7400, profit: 2200 },
  { month: "Feb", revenue: 6200, profit: 1400 },
];

const TRUST_ITEMS = ["Free to start", "No credit card", "iCal calendar sync"];

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <div className="auth-bg" aria-hidden="true" />
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
    <div className={`auth-shell ${mounted ? "auth-shell--ready" : ""}`}>
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-orb auth-bg-orb--1" />
        <div className="auth-bg-orb auth-bg-orb--2" />
        <div className="auth-bg-grid" />
      </div>

      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <Link href="/" className="auth-brand">
            <img src="/logo.png" alt="Tracktar" className="auth-brand-logo" />
          </Link>

          <div className="auth-left-body">
            <p className="auth-left-eyebrow">Short-term rental intelligence</p>
            <h2 className="auth-left-heading">
              Know your numbers.<br />
              <em>Grow your income.</em>
            </h2>
            <p className="auth-left-desc">
              Bookings, expenses, referrals, and monthly P&amp;L — organized per property in one dashboard built for hosts.
            </p>

            <div className="auth-preview">
              <div className="auth-preview-glow" aria-hidden="true" />
              <div className="auth-preview-chrome">
                <span className="auth-preview-dot" />
                <span className="auth-preview-dot" />
                <span className="auth-preview-dot" />
                <span className="auth-preview-url">tracktar.com/dashboard</span>
              </div>
              <div className="auth-preview-body">
                <div className="auth-preview-sidebar">
                  <div className="auth-preview-brand">⌂ Tracktar</div>
                  <div className="auth-preview-prop auth-preview-prop--active">Downtown Loft</div>
                  <div className="auth-preview-prop">Beach Villa</div>
                </div>
                <div className="auth-preview-main">
                  <div className="auth-preview-tabs">
                    <span className="auth-preview-tab auth-preview-tab--active">Summary</span>
                    <span className="auth-preview-tab">Bookings</span>
                    <span className="auth-preview-tab">Expenses</span>
                  </div>
                  <div className="auth-preview-rows">
                    {PREVIEW_MONTHS.map((row) => (
                      <div className="auth-preview-row" key={row.month}>
                        <span className="auth-preview-month">{row.month}</span>
                        <div className="auth-preview-bar-wrap">
                          <div
                            className="auth-preview-bar"
                            style={{ width: `${(row.revenue / 10000) * 100}%` }}
                          />
                        </div>
                        <span className="auth-preview-profit">+{row.profit.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="auth-preview-badge">
                <span className="auth-preview-badge-dot" />
                +KSh 3,900 profit · April
              </div>
            </div>

            <ul className="auth-trust">
              {TRUST_ITEMS.map((item) => (
                <li key={item} className="auth-trust-item">
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
                    <path d="M3.5 8.2l2.8 2.8 6.2-6.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="auth-left-footer">© 2026 Tracktar</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-card">
          <Link href="/" className="auth-home-link">
            ← Back to home
          </Link>

          <Link href="/" className="auth-brand auth-brand-mobile">
            <img src="/logo.png" alt="Tracktar" className="auth-brand-logo" />
          </Link>

          {mode !== "reset" && (
            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sign-in"}
                className={`auth-tab ${mode === "sign-in" ? "active" : ""}`}
                onClick={() => switchMode("sign-in")}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sign-up"}
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
                <label className="auth-label" htmlFor="auth-name">Your name</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
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
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">Email address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
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
            </div>

            {mode !== "reset" && (
              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label" htmlFor="auth-password">Password</label>
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
                  <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
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
                    className="auth-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
                        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
                        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}
            {info && (
              <div className="auth-alert auth-alert-info" role="status">
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {info}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={pending}>
              {pending ? (
                <><span className="auth-btn-spinner" aria-hidden="true" />{submitLabel}…</>
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

          {mode === "reset" && (
            <button type="button" className="auth-back-btn" onClick={() => switchMode("sign-in")}>
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
          <div className="auth-bg" aria-hidden="true" />
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
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .auth-shell {
    --bg: #0b0c10;
    --bg2: #111318;
    --bg3: #181a21;
    --bd: rgba(255,255,255,0.07);
    --bd2: rgba(255,255,255,0.12);
    --text: #e8e6df;
    --muted: #7a7d8a;
    --faint: #3a3d4a;
    --sage: #81B29A;
    --coral: #E07A5F;
    --serif: 'Instrument Serif', Georgia, serif;
    --sans: 'Geist', system-ui, sans-serif;

    position: relative;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    background: var(--bg);
    font-family: var(--sans);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  .auth-shell--ready .auth-left-inner,
  .auth-shell--ready .auth-card {
    animation: auth-rise 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .auth-shell--ready .auth-card { animation-delay: 0.08s; }

  @keyframes auth-rise {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Background ── */
  .auth-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }
  .auth-bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
  }
  .auth-bg-orb--1 {
    top: -120px; left: -80px;
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(129,178,154,0.14) 0%, transparent 70%);
  }
  .auth-bg-orb--2 {
    bottom: -100px; right: 10%;
    width: 440px; height: 440px;
    background: radial-gradient(circle, rgba(61,64,91,0.22) 0%, transparent 70%);
  }
  .auth-bg-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 70% at 30% 40%, black 20%, transparent 75%);
  }

  /* ── Spinner ── */
  .auth-spinner {
    position: relative;
    z-index: 1;
    width: 28px; height: 28px;
    border: 2.5px solid var(--bd);
    border-top-color: var(--sage);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin: auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Left panel ── */
  .auth-left {
    display: none;
    width: 48%;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
    border-right: 1px solid var(--bd);
  }
  .auth-left-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 36px 44px 32px;
  }
  .auth-left-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 24px 0 32px;
  }
  .auth-left-eyebrow {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--sage);
    margin: 0 0 14px;
  }
  .auth-left-heading {
    font-family: var(--serif);
    font-size: clamp(34px, 3.2vw, 44px);
    font-weight: 400;
    color: var(--text);
    line-height: 1.12;
    margin: 0 0 16px;
    letter-spacing: -0.02em;
  }
  .auth-left-heading em {
    font-style: italic;
    color: var(--sage);
  }
  .auth-left-desc {
    font-size: 15px;
    color: var(--muted);
    line-height: 1.65;
    margin: 0 0 28px;
    max-width: 380px;
  }

  /* ── Dashboard preview ── */
  .auth-preview {
    position: relative;
    border: 1px solid var(--bd2);
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(17,19,24,0.95) 0%, rgba(11,12,16,0.98) 100%);
    box-shadow:
      0 24px 60px rgba(0,0,0,0.45),
      inset 0 1px 0 rgba(255,255,255,0.06);
    overflow: hidden;
    margin-bottom: 24px;
  }
  .auth-preview-glow {
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    background: radial-gradient(circle, rgba(129,178,154,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .auth-preview-chrome {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--bd);
    background: rgba(0,0,0,0.25);
  }
  .auth-preview-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #2a2d38;
  }
  .auth-preview-dot:nth-child(1) { background: #E07A5F; opacity: 0.85; }
  .auth-preview-dot:nth-child(2) { background: #F2CC8F; opacity: 0.85; }
  .auth-preview-dot:nth-child(3) { background: #81B29A; opacity: 0.85; }
  .auth-preview-url {
    margin-left: 8px;
    font-size: 11px;
    color: var(--muted);
    font-family: ui-monospace, monospace;
  }
  .auth-preview-body {
    display: flex;
    min-height: 168px;
  }
  .auth-preview-sidebar {
    width: 34%;
    padding: 14px 12px;
    border-right: 1px solid var(--bd);
    background: rgba(0,0,0,0.18);
  }
  .auth-preview-brand {
    font-size: 11px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 14px;
  }
  .auth-preview-prop {
    font-size: 10.5px;
    color: var(--muted);
    padding: 6px 8px;
    border-radius: 6px;
    margin-bottom: 4px;
  }
  .auth-preview-prop--active {
    background: rgba(129,178,154,0.12);
    color: var(--sage);
    border: 1px solid rgba(129,178,154,0.22);
  }
  .auth-preview-main { flex: 1; padding: 14px 16px; }
  .auth-preview-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .auth-preview-tab {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid transparent;
  }
  .auth-preview-tab--active {
    color: var(--sage);
    border-color: rgba(129,178,154,0.25);
    background: rgba(129,178,154,0.08);
  }
  .auth-preview-rows { display: flex; flex-direction: column; gap: 10px; }
  .auth-preview-row {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 8px;
  }
  .auth-preview-month {
    font-size: 10px;
    font-weight: 600;
    color: var(--muted);
  }
  .auth-preview-bar-wrap {
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 999px;
    overflow: hidden;
  }
  .auth-preview-bar {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(129,178,154,0.5), var(--sage));
  }
  .auth-preview-profit {
    font-size: 10px;
    font-weight: 700;
    color: var(--sage);
    font-variant-numeric: tabular-nums;
  }
  .auth-preview-badge {
    position: absolute;
    bottom: 14px;
    right: 14px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(12,14,20,0.92);
    border: 1px solid rgba(129,178,154,0.28);
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  }
  .auth-preview-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--sage);
    animation: auth-pulse 2s ease-in-out infinite;
  }
  @keyframes auth-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.55; transform: scale(0.85); }
  }

  .auth-trust {
    list-style: none;
    padding: 0; margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
  }
  .auth-trust-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--muted);
  }
  .auth-trust-item svg { color: var(--sage); flex-shrink: 0; }

  .auth-left-footer {
    font-size: 12px;
    color: var(--faint);
    margin: 0;
  }

  /* ── Right panel ── */
  .auth-right {
    flex: 1;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    overflow-y: auto;
  }
  .auth-card {
    width: 100%;
    max-width: 440px;
    padding: 32px 32px 28px;
    border-radius: 20px;
    border: 1px solid var(--bd2);
    background: linear-gradient(160deg, rgba(17,19,24,0.88) 0%, rgba(11,12,16,0.94) 100%);
    box-shadow:
      0 32px 80px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .auth-home-link {
    display: inline-flex;
    align-items: center;
    margin-bottom: 22px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.15s;
  }
  .auth-home-link:hover { color: var(--sage); }

  .auth-brand {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    margin-bottom: 28px;
  }
  .auth-brand-mobile { display: none; }
  .auth-brand-logo {
    height: 48px;
    width: auto;
    display: block;
    filter: brightness(0) invert(1);
  }

  .auth-tabs {
    display: flex;
    background: rgba(0,0,0,0.35);
    border: 1px solid var(--bd);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 26px;
    gap: 4px;
  }
  .auth-tab {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 9px;
    background: transparent;
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.18s;
  }
  .auth-tab.active {
    background: var(--bg3);
    color: var(--text);
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }
  .auth-tab:not(.active):hover { color: #a8abb6; }

  .auth-heading-block { margin-bottom: 26px; }
  .auth-heading {
    font-family: var(--serif);
    font-size: 28px;
    font-weight: 400;
    color: var(--text);
    margin: 0 0 8px;
    letter-spacing: -0.02em;
  }
  .auth-sub {
    font-size: 14.5px;
    color: var(--muted);
    margin: 0;
    line-height: 1.55;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 20px;
  }
  .auth-field { display: flex; flex-direction: column; gap: 8px; }
  .auth-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .auth-label {
    font-size: 12px;
    font-weight: 600;
    color: #a8abb6;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .auth-forgot {
    background: none; border: none; padding: 0;
    font-size: 12px; color: var(--sage);
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
    left: 14px;
    color: var(--faint);
    width: 17px; height: 17px;
    pointer-events: none;
  }
  .auth-input {
    width: 100%;
    padding: 14px 14px 14px 42px;
    background: rgba(0,0,0,0.35);
    border: 1.5px solid var(--bd);
    border-radius: 12px;
    color: var(--text);
    font-size: 15px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .auth-input:hover {
    border-color: rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.45);
  }
  .auth-input:focus-visible {
    border-color: var(--sage);
    box-shadow: 0 0 0 3px rgba(129,178,154,0.12);
    outline: none;
  }
  .auth-input::placeholder { color: #5a5d68; }
  .auth-input-password { padding-right: 44px; }
  .auth-eye {
    position: absolute; right: 14px;
    background: none; border: none; padding: 0;
    color: var(--faint); cursor: pointer;
    display: flex; align-items: center;
    transition: color 0.15s;
  }
  .auth-eye:hover { color: var(--sage); }

  .auth-alert {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.45;
  }
  .auth-alert-error { background: rgba(224,122,95,0.08); border: 1px solid rgba(224,122,95,0.22); color: var(--coral); }
  .auth-alert-info  { background: rgba(129,178,154,0.08); border: 1px solid rgba(129,178,154,0.22); color: var(--sage); }

  .auth-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 15px 18px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #8fc4a8 0%, var(--sage) 50%, #6fa088 100%);
    color: #0b0c10;
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
    box-shadow: 0 8px 24px rgba(129,178,154,0.22);
    margin-top: 4px;
  }
  .auth-submit:hover:not(:disabled) {
    opacity: 0.95;
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(129,178,154,0.28);
  }
  .auth-submit:active:not(:disabled) { transform: translateY(0); }
  .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
  .auth-btn-spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(11,12,16,0.25);
    border-top-color: #0b0c10;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 2px 0 16px;
    color: var(--faint);
    font-size: 11px;
  }
  .auth-divider::before, .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--bd);
  }
  .auth-divider span {
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .auth-google {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px 18px;
    border: 1.5px solid var(--bd);
    border-radius: 12px;
    background: rgba(0,0,0,0.3);
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.1s;
    margin-bottom: 22px;
  }
  .auth-google:hover:not(:disabled) {
    border-color: rgba(66,133,244,0.45);
    background: rgba(66,133,244,0.06);
    transform: translateY(-1px);
  }
  .auth-google:disabled { opacity: 0.5; cursor: not-allowed; }

  .auth-back-btn {
    background: none; border: none; padding: 0;
    font-size: 13px; color: var(--sage);
    cursor: pointer; font-family: inherit;
    margin: 4px 0 22px;
    transition: opacity 0.15s;
  }
  .auth-back-btn:hover { opacity: 0.75; }

  .auth-terms {
    font-size: 12px;
    color: var(--muted);
    text-align: center;
    margin: 0;
    line-height: 1.65;
  }
  .auth-terms-link { color: #a8abb6; text-decoration: underline; text-underline-offset: 2px; }
  .auth-terms-link:hover { color: var(--sage); }

  .auth-tab:focus-visible,
  .auth-forgot:focus-visible,
  .auth-back-btn:focus-visible,
  .auth-home-link:focus-visible,
  .auth-eye:focus-visible {
    outline: 2px solid var(--sage);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (min-width: 900px) {
    .auth-left { display: flex; flex-direction: column; }
    .auth-brand-mobile { display: none !important; }
  }

  @media (max-width: 899px) {
    .auth-right { padding: 24px 16px 40px; align-items: flex-start; }
    .auth-card {
      max-width: 100%;
      padding: 24px 20px 22px;
      border-radius: 16px;
    }
    .auth-brand-mobile { display: inline-flex; margin-bottom: 20px; }
    .auth-heading { font-size: 24px; }
    .auth-home-link { margin-bottom: 16px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .auth-shell--ready .auth-left-inner,
    .auth-shell--ready .auth-card,
    .auth-preview-badge-dot,
    .auth-btn-spinner,
    .auth-spinner {
      animation: none !important;
    }
  }
`;
