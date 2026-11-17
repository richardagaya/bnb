"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { saveMarketingEmail } from "@/lib/firestore";
import { NavAccount } from "@/app/components/NavAccount";
import "./landing-page.css";

export const siteFont = Inter({
  subsets: ["latin"],
  variable: "--lp-inter",
  display: "swap",
});

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
  { href: "/tools", label: "Host hub" },
  { href: "/blog", label: "Blog" },
  { href: "/verify", label: "Verify" },
];

function NavItem({ href, label, current, onClick }: { href: string; label: string; current?: boolean; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} aria-current={current ? "page" : undefined}>
      {label}
    </Link>
  );
}

export function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Image src="/logo-wordmark.png" alt="Tracktar" width={250} height={104} className="lp-wordmark" priority />
  );
}

export function SiteNav({ current }: { current?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className={`lp-nav${scrolled ? " lp-nav--scrolled" : ""}`}>
        <div className="lp-wrap lp-nav-inner">
          <Link href="/" className="lp-nav-brand" aria-label="Tracktar home" onClick={close}>
            <Wordmark />
          </Link>
          <nav aria-label="Main">
            <ul className="lp-nav-links">
              {NAV_LINKS.map((l) => (
                <li key={l.href}><NavItem {...l} current={l.href === current} /></li>
              ))}
            </ul>
          </nav>
          <div className="lp-nav-end">
            <NavAccount />
            <button
              type="button"
              className={`lp-menu-btn${open ? " lp-menu-btn--open" : ""}`}
              aria-expanded={open}
              aria-controls="lp-drawer"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <>
          <div className="lp-drawer-backdrop" onClick={close} aria-hidden="true" />
          <div id="lp-drawer" className="lp-drawer" role="dialog" aria-modal="true" aria-label="Site navigation">
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href}><NavItem {...l} current={l.href === current} onClick={close} /></li>
              ))}
            </ul>
            <div className="lp-drawer-account">
              <NavAccount onClick={close} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === "loading" || state === "done") return;
    setState("loading");
    try {
      await saveMarketingEmail(email.trim(), "landing-footer");
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <Wordmark />
            <p>Bookings, expenses and monthly profit for short-term rental hosts.</p>
          </div>

          <div className="lp-footer-cols">
            <div>
              <h4>Product</h4>
              <Link href="/#features">Features</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/#demo">Tour</Link>
              <Link href="/login">Log in</Link>
            </div>
            <div>
              <h4>Resources</h4>
              <Link href="/tools">Host hub</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/verify">Verify a number</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy-policy">Privacy</Link>
              <Link href="/terms-of-service">Terms</Link>
            </div>
          </div>

          <form className="lp-news" onSubmit={submit}>
            <label htmlFor="lp-news-email">Occasional emails about new features and hosting tips.</label>
            {state === "done" ? (
              <p className="lp-news-done" role="status">Thanks, you&apos;re on the list.</p>
            ) : (
              <div className="lp-news-row">
                <input
                  id="lp-news-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state === "error") setState("idle");
                  }}
                  disabled={state === "loading"}
                />
                <button type="submit" disabled={state === "loading"}>
                  {state === "loading" ? "Saving…" : "Subscribe"}
                </button>
              </div>
            )}
            {state === "error" && (
              <p className="lp-news-error" role="alert">That didn&apos;t go through. Please try again.</p>
            )}
          </form>
        </div>

        <div className="lp-footer-bottom">
          <p>© 2026 Tracktar</p>
          <div className="lp-footer-social">
            <a href="https://www.instagram.com/tractar.app" target="_blank" rel="noopener noreferrer" aria-label="Tracktar on Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
              </svg>
            </a>
            <a href="https://www.tiktok.com/@tracktar.app" target="_blank" rel="noopener noreferrer" aria-label="Tracktar on TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.6 5.82a4.278 4.278 0 0 1-.675-1.126 4.14 4.14 0 0 1-.41-1.017 3.616 3.616 0 0 1-.043-.63V2.5h-3.45v13.845a2.327 2.327 0 0 1-2.305 2.333 2.327 2.327 0 0 1-2.305-2.333 2.327 2.327 0 0 1 2.305-2.333c.24 0 .472.038.691.108v-3.36a5.689 5.689 0 0 0-.691-.042 5.803 5.803 0 0 0-5.996 5.996 5.803 5.803 0 0 0 5.996 5.996 5.803 5.803 0 0 0 5.996-5.996V9.01a8.238 8.238 0 0 0 4.773 1.526V7.086a4.278 4.278 0 0 1-1.126-.266z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
