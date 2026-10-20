"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.2" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.2 13.2c.7-2.2 2.5-3.3 4.8-3.3s4.1 1.1 4.8 3.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavAccount({ onClick }: { onClick?: () => void }) {
  const { user, isReady, signOut } = useAuth();
  const router = useRouter();

  const go = (href: string) => {
    onClick?.();
    router.push(href);
  };

  const logout = async () => {
    onClick?.();
    router.replace("/");
    await signOut();
  };

  if (!isReady) {
    return <span className="nav-account nav-account--pending" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <>
        <AccountStyles />
        <button type="button" className="nav-account-login" onClick={() => go("/login")} aria-label="Log in">
          <PersonIcon />
          <span>Log in</span>
        </button>
      </>
    );
  }

  const initial = (user.name.trim() || user.email).charAt(0).toUpperCase();

  return (
    <div className="nav-account">
      <AccountStyles />
      <span className="nav-account-badge" title={user.email} aria-label={`Signed in as ${user.email}`}>
        {initial}
      </span>
      <button type="button" className="nav-account-dash" onClick={() => go("/dashboard")}>
        Dashboard
      </button>
      <button type="button" className="nav-account-out" onClick={logout}>
        Log out
      </button>
    </div>
  );
}

function AccountStyles() {
  return (
    <style>{`
      .nav-account {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .nav-account-badge {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #3d405b;
        color: #f7f4ec;
        font-size: 13px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .nav-account-login,
      .nav-account-dash,
      .nav-account-out {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 8px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        line-height: 1;
        padding: 8px 14px;
      }
      .nav-account-login,
      .nav-account-dash {
        background: #3d405b;
        color: #f7f4ec;
        border: 0;
      }
      .nav-account-login svg,
      .nav-account-dash svg {
        stroke: #f7f4ec;
      }
      .nav-account-login:hover,
      .nav-account-dash:hover { opacity: 0.88; }
      .nav-account-out {
        background: #ffffff;
        color: #1a1d27;
        border: 1px solid #c5c1b6;
      }
      .nav-account-out:hover {
        border-color: #e07a5f;
        color: #e07a5f;
      }
    `}</style>
  );
}
