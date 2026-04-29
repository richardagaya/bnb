"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Stage = "verifying" | "form" | "success" | "invalid";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") ?? "";
  const mode    = searchParams.get("mode") ?? "";

  const [stage, setStage]           = useState<Stage>("verifying");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [pending, setPending]       = useState(false);

  // Verify the reset code on mount
  useEffect(() => {
    if (!oobCode || mode !== "resetPassword") {
      setStage("invalid");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
        setStage("form");
      })
      .catch(() => setStage("invalid"));
  }, [oobCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setPending(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStage("success");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/expired-action-code") {
        setError("This reset link has expired. Please request a new one.");
      } else if (code === "auth/invalid-action-code") {
        setError("This reset link is invalid or has already been used.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rp-shell">
      <div className="rp-card">
        <Link href="/" className="rp-brand">
          <img src="/logo.png" alt="Tractar" className="rp-brand-logo" />
        </Link>

        {/* ── Verifying ── */}
        {stage === "verifying" && (
          <div className="rp-state-center">
            <span className="rp-spinner" />
            <p className="rp-state-text">Verifying your link…</p>
          </div>
        )}

        {/* ── Invalid / Expired ── */}
        {stage === "invalid" && (
          <div className="rp-state-center">
            <div className="rp-icon-circle rp-icon-red">
              <svg viewBox="0 0 20 20" fill="none" width="22" height="22">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="rp-title">Link expired or invalid</h1>
            <p className="rp-sub">
              This password reset link has expired or already been used.<br />
              Request a new one from the sign in page.
            </p>
            <Link href="/login" className="rp-btn-primary">
              Back to sign in
            </Link>
          </div>
        )}

        {/* ── Form ── */}
        {stage === "form" && (
          <>
            <div className="rp-heading-block">
              <div className="rp-icon-circle rp-icon-green">
                <svg viewBox="0 0 20 20" fill="none" width="22" height="22">
                  <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="rp-title">Set a new password</h1>
              <p className="rp-sub">
                Resetting password for <strong className="rp-email">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="rp-form" noValidate>
              <div className="rp-field">
                <label className="rp-label">New password</label>
                <div className="rp-input-wrap">
                  <svg className="rp-input-icon" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    className="rp-input"
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="rp-eye" tabIndex={-1}
                    onClick={() => setShowPw(v => !v)}>
                    {showPw ? (
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

              <div className="rp-field">
                <label className="rp-label">Confirm password</label>
                <div className="rp-input-wrap">
                  <svg className="rp-input-icon" viewBox="0 0 20 20" fill="none">
                    <path d="M5 9V6.5a5 5 0 0 1 10 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="10" cy="14" r="1.5" fill="currentColor"/>
                    <rect x="3" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <input
                    className={`rp-input${confirm && confirm !== password ? " rp-input-error" : ""}`}
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <button type="button" className="rp-eye" tabIndex={-1}
                    onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? (
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
                {confirm && confirm !== password && (
                  <p className="rp-field-hint">Passwords don&apos;t match yet</p>
                )}
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="rp-strength">
                  <div className="rp-strength-bars">
                    {[1,2,3,4].map((n) => (
                      <div
                        key={n}
                        className="rp-strength-bar"
                        style={{
                          background: password.length >= n * 3
                            ? password.length >= 12 ? "#81b29a"
                              : password.length >= 8 ? "#F2CC8F"
                              : "#e07a5f"
                            : "#1e2130"
                        }}
                      />
                    ))}
                  </div>
                  <span className="rp-strength-label">
                    {password.length < 6 ? "Too short" :
                     password.length < 8 ? "Weak" :
                     password.length < 12 ? "Good" : "Strong"}
                  </span>
                </div>
              )}

              {error && (
                <div className="rp-alert">
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="rp-submit"
                disabled={pending || password.length < 6 || password !== confirm}
              >
                {pending ? <><span className="rp-btn-spinner" /> Saving…</> : "Set new password"}
              </button>
            </form>
          </>
        )}

        {/* ── Success ── */}
        {stage === "success" && (
          <div className="rp-state-center">
            <div className="rp-icon-circle rp-icon-green">
              <svg viewBox="0 0 20 20" fill="none" width="22" height="22">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6.5 10l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="rp-title">Password updated!</h1>
            <p className="rp-sub">
              Your password has been reset successfully.<br />
              You can now sign in with your new password.
            </p>
            <button
              className="rp-btn-primary"
              onClick={() => router.replace("/login")}
            >
              Sign in now
            </button>
          </div>
        )}

        <Link href="/" className="rp-back">← Back to home</Link>
      </div>

      <style jsx>{`
        *, *::before, *::after { box-sizing: border-box; }

        .rp-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          background: #0c0e14;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .rp-card {
          width: 100%;
          max-width: 440px;
          background: #0f1219;
          border: 1px solid #1e2130;
          border-radius: 20px;
          padding: 36px 36px 28px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.4);
        }

        /* Brand */
        .rp-brand {
          display: inline-flex; align-items: center;
          text-decoration: none; margin-bottom: 32px;
        }
        .rp-brand-logo {
          height: 52px; width: auto; display: block;
          filter: brightness(0) invert(1);
        }

        /* Heading block */
        .rp-heading-block { margin-bottom: 28px; }
        .rp-icon-circle {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }
        .rp-icon-green { background: rgba(129,178,154,0.12); color: #81b29a; border: 1px solid rgba(129,178,154,0.25); }
        .rp-icon-red   { background: rgba(224,122,95,0.12);  color: #e07a5f; border: 1px solid rgba(224,122,95,0.25); }

        .rp-title {
          font-size: 24px; font-weight: 800;
          color: #e8e3d9; margin: 0 0 8px;
          letter-spacing: -0.025em;
        }
        .rp-sub {
          font-size: 14px; color: #4a5068;
          line-height: 1.6; margin: 0;
        }
        .rp-email { color: #8a91a8; font-weight: 600; font-style: normal; }

        /* State center (spinner, invalid, success) */
        .rp-state-center {
          display: flex; flex-direction: column;
          align-items: flex-start; gap: 14px;
          padding: 8px 0 12px;
        }

        /* Spinner */
        .rp-spinner {
          width: 28px; height: 28px;
          border: 2.5px solid #1e2130;
          border-top-color: #81b29a;
          border-radius: 50%;
          animation: rp-spin 0.7s linear infinite;
          display: block;
        }
        @keyframes rp-spin { to { transform: rotate(360deg); } }
        .rp-state-text { font-size: 14px; color: #4a5068; }

        /* Form */
        .rp-form { display: flex; flex-direction: column; gap: 20px; margin-bottom: 20px; }
        .rp-field { display: flex; flex-direction: column; gap: 7px; }
        .rp-label {
          font-size: 12px; font-weight: 600; color: #8a91a8;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .rp-input-wrap { position: relative; display: flex; align-items: center; }
        .rp-input-icon {
          position: absolute; left: 13px; color: #3a4060;
          width: 17px; height: 17px; pointer-events: none;
        }
        .rp-input {
          width: 100%; padding: 13px 42px 13px 40px;
          background: #0c0e14; border: 1.5px solid #1e2130;
          border-radius: 10px; color: #e8e3d9;
          font-size: 15px; font-family: inherit; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .rp-input:focus { border-color: #81b29a; box-shadow: 0 0 0 3px rgba(129,178,154,0.10); }
        .rp-input::placeholder { color: #2a3050; }
        .rp-input-error { border-color: #e07a5f44 !important; }
        .rp-eye {
          position: absolute; right: 13px;
          background: none; border: none; padding: 0;
          color: #3a4060; cursor: pointer;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .rp-eye:hover { color: #81b29a; }
        .rp-field-hint { font-size: 11px; color: #e07a5f; margin-top: 2px; }

        /* Strength */
        .rp-strength {
          display: flex; align-items: center; gap: 10px;
          margin-top: -8px;
        }
        .rp-strength-bars { display: flex; gap: 4px; }
        .rp-strength-bar {
          width: 36px; height: 4px; border-radius: 2px;
          transition: background 0.2s;
        }
        .rp-strength-label { font-size: 11px; color: #4a5068; }

        /* Alert */
        .rp-alert {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 11px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 500; line-height: 1.45;
          background: #1a0e0c; border: 1px solid #e07a5f33; color: #e07a5f;
        }

        /* Submit */
        .rp-submit {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px; border: none; border-radius: 10px;
          background: #81b29a; color: #0c0e14;
          font-size: 15px; font-weight: 700; font-family: inherit;
          cursor: pointer; transition: opacity 0.15s, transform 0.1s;
        }
        .rp-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .rp-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .rp-btn-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(12,14,20,0.3);
          border-top-color: #0c0e14;
          border-radius: 50%;
          animation: rp-spin 0.7s linear infinite;
        }

        /* Primary button (state screens) */
        .rp-btn-primary {
          display: inline-flex; align-items: center;
          padding: 13px 24px; border: none; border-radius: 10px;
          background: #81b29a; color: #0c0e14;
          font-size: 14px; font-weight: 700; font-family: inherit;
          cursor: pointer; text-decoration: none;
          transition: opacity 0.15s;
        }
        .rp-btn-primary:hover { opacity: 0.88; }

        /* Back link */
        .rp-back {
          display: block; margin-top: 24px;
          text-align: center; font-size: 13px;
          color: #3a4060; text-decoration: none;
          transition: color 0.15s;
        }
        .rp-back:hover { color: #81b29a; }

        @media (max-width: 480px) {
          .rp-card { padding: 28px 22px 22px; }
          .rp-title { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", background: "#0c0e14"
        }}>
          <div style={{
            width: 28, height: 28,
            border: "2.5px solid #1e2130",
            borderTopColor: "#81b29a",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite"
          }} />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
