"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Wordmark, siteFont } from "@/app/components/SiteChrome";
import "./auth.css";

type Mode = "sign-in" | "sign-up" | "reset";

function initialMode(params: URLSearchParams): Mode {
  if (params.get("reset") === "1") return "reset";
  if (params.get("mode") === "signup") return "sign-up";
  return "sign-in";
}

function LoginForm() {
  const { user, isReady, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<Mode>(() => initialMode(searchParams));
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
        setInfo("Password reset email sent. Check your inbox.");
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

  if (!isReady || user) return <AuthLoading />;

  const heading =
    mode === "sign-up" ? "Create your account" :
    mode === "reset"   ? "Reset your password" :
                         "Welcome back";

  const sub =
    mode === "sign-up" ? "Free to start. Add your first property in about five minutes." :
    mode === "reset"   ? "Enter the email you signed up with and we'll send you a reset link." :
                         "Sign in to see how your properties are doing.";

  const submitLabel =
    mode === "sign-up" ? "Create account" :
    mode === "reset"   ? "Send reset link" :
                         "Sign in";

  return (
    <div className="au-form-wrap">
      {mode !== "reset" ? (
        <div className="au-seg" role="tablist" aria-label="Account">
          <button type="button" role="tab" aria-selected={mode === "sign-in"} className={mode === "sign-in" ? "is-active" : undefined} onClick={() => switchMode("sign-in")}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={mode === "sign-up"} className={mode === "sign-up" ? "is-active" : undefined} onClick={() => switchMode("sign-up")}>
            Create account
          </button>
        </div>
      ) : (
        <button type="button" className="au-back" onClick={() => switchMode("sign-in")}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to sign in
        </button>
      )}

      <h1 className="au-heading">{heading}</h1>
      <p className="au-sub">{sub}</p>

      {mode !== "reset" && (
        <>
          <button type="button" className="au-google" onClick={handleGoogle} disabled={googlePending || pending}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            {googlePending ? "Connecting to Google…" : "Continue with Google"}
          </button>
          <div className="au-divider"><span>or with email</span></div>
        </>
      )}

      <form onSubmit={handleSubmit} className="au-form" noValidate>
        {mode === "sign-up" && (
          <div className="au-field">
            <label htmlFor="auth-name">Your name</label>
            <input
              id="auth-name"
              type="text"
              autoComplete="name"
              placeholder="Alex Kamau"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="au-field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode !== "reset" && (
          <div className="au-field">
            <div className="au-label-row">
              <label htmlFor="auth-password">Password</label>
              {mode === "sign-in" && (
                <button type="button" className="au-link" onClick={() => switchMode("reset")}>
                  Forgot password?
                </button>
              )}
            </div>
            <div className="au-password">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                placeholder={mode === "sign-up" ? "At least 6 characters" : "Your password"}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={mode === "sign-up" ? "auth-password-hint" : undefined}
              />
              <button
                type="button"
                className="au-show"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {mode === "sign-up" && (
              <p id="auth-password-hint" className="au-hint">Use 6 or more characters.</p>
            )}
          </div>
        )}

        {error && <div className="au-alert au-alert--error" role="alert">{error}</div>}
        {info && <div className="au-alert au-alert--info" role="status">{info}</div>}

        <button type="submit" className="au-submit" disabled={pending}>
          {pending ? `${submitLabel}…` : submitLabel}
        </button>
      </form>

      <p className="au-terms">
        By continuing, you agree to our{" "}
        <Link href="/terms-of-service">Terms</Link> and{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="au-form-wrap au-loading" aria-busy="true" aria-label="Loading">
      <span className="au-spinner" />
    </div>
  );
}

function AuthAside() {
  return (
    <aside className="au-aside" aria-hidden="true">
      <div className="au-aside-inner">
        <p className="au-aside-kicker">Tracktar</p>
        <p className="au-aside-title">Know what every property made this month.</p>

        <div className="au-preview">
          <div className="au-preview-head">
            <span>Westlands Loft</span>
            <span>October 2026</span>
          </div>
          <div className="au-preview-big">
            <small>Net profit</small>
            <b>KSh 92,200</b>
            <em>+19.6% vs September</em>
          </div>
          <dl>
            <div><dt>Revenue · 9 bookings</dt><dd>KSh 184,500</dd></div>
            <div><dt>Rent, utilities, cleaner</dt><dd className="neg">−KSh 63,500</dd></div>
            <div><dt>Logged expenses</dt><dd className="neg">−KSh 28,800</dd></div>
          </dl>
        </div>

        <ul className="au-points">
          <li>Bookings, expenses and calendars in one place</li>
          <li>Imports from Airbnb, Booking.com and Vrbo</li>
          <li>A summary in your inbox on the 1st of every month</li>
        </ul>
      </div>
    </aside>
  );
}

export default function LoginPage() {
  return (
    <div className={`lp au ${siteFont.variable}`}>
      <main className="au-main">
        <div className="au-left">
          <header className="au-top">
            <Link href="/" aria-label="Tracktar home"><Wordmark /></Link>
            <Link href="/" className="au-top-link">Back to site</Link>
          </header>

          <Suspense fallback={<AuthLoading />}>
            <LoginForm />
          </Suspense>

          <footer className="au-foot">
            <span>© 2026 Tracktar</span>
            <Link href="/contact">Need help?</Link>
          </footer>
        </div>

        <AuthAside />
      </main>
    </div>
  );
}
