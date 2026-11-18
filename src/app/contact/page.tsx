import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav } from "@/app/components/SiteChrome";
import { siteFont } from "@/app/components/siteFont";
import { CopyEmail } from "./CopyEmail";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact | Tracktar",
  description: "Get in touch with Tracktar support, feedback, and general inquiries.",
};

const SUPPORT_EMAIL = "support@tracktar.com";
const FEEDBACK_FORM_URL = "https://forms.gle/AtsJdJV4RC4Co6HG6";

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4 2.5h5.5V8M9.5 2.5 3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CHANNELS = [
  {
    title: "Product feedback",
    body: "Found a bug, or wish Tracktar did something it doesn't? Tell us. Every submission is read and it shapes what we build next.",
    cta: "Open the feedback form",
    href: FEEDBACK_FORM_URL,
    external: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Instagram",
    body: "Hosting tips, product updates, and a DM inbox if that's easier than email.",
    cta: "@tractar.app",
    href: "https://www.instagram.com/tractar.app",
    external: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "TikTok",
    body: "Short walkthroughs of Tracktar features and the numbers behind hosting.",
    cta: "@tracktar.app",
    href: "https://www.tiktok.com/@tracktar.app",
    external: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.6 5.82a4.278 4.278 0 0 1-.675-1.126 4.14 4.14 0 0 1-.41-1.017 3.616 3.616 0 0 1-.043-.63V2.5h-3.45v13.845a2.327 2.327 0 0 1-2.305 2.333 2.327 2.327 0 0 1-2.305-2.333 2.327 2.327 0 0 1 2.305-2.333c.24 0 .472.038.691.108v-3.36a5.689 5.689 0 0 0-.691-.042 5.803 5.803 0 0 0-5.996 5.996 5.803 5.803 0 0 0 5.996 5.996 5.803 5.803 0 0 0 5.996-5.996V9.01a8.238 8.238 0 0 0 4.773 1.526V7.086a4.278 4.278 0 0 1-1.126-.266z" />
      </svg>
    ),
  },
];

const QUICK_ANSWERS = [
  { q: "Is Tracktar free?", href: "/#faq" },
  { q: "Which booking platforms does it work with?", href: "/#faq" },
  { q: "Can my co-host use it?", href: "/#faq" },
  { q: "Who builds Tracktar?", href: "/about" },
];

export default function ContactPage() {
  return (
    <div className={`lp ct ${siteFont.variable}`}>
      <a href="#main" className="lp-skip">Skip to content</a>
      <SiteNav />

      <main id="main">
        <section className="ct-hero">
          <div className="lp-wrap ct-hero-grid">
            <div className="ct-hero-copy">
              <p className="lp-kicker">Contact</p>
              <h1 className="ct-title">Questions, ideas, problems. <em>We&apos;d like to hear them.</em></h1>
              <p className="lp-lead">
                Whether it&apos;s your account, a number that doesn&apos;t look right, or how we handle
                your data, write to us. Messages go straight to the people building Tracktar.
              </p>
            </div>

            <div className="ct-email-card">
              <p className="ct-email-label">Email support</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="ct-email">{SUPPORT_EMAIL}</a>
              <p className="ct-email-note">
                Account help, billing, data questions or anything else. Include the email you
                signed up with and we&apos;ll get to the answer faster.
              </p>
              <div className="ct-email-actions">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="lp-btn lp-btn--light">Write an email</a>
                <CopyEmail email={SUPPORT_EMAIL} />
              </div>
            </div>
          </div>
        </section>

        <section className="ct-section">
          <div className="lp-wrap">
            <h2 className="ct-h2">Other ways to reach us</h2>
            <div className="ct-channels">
              {CHANNELS.map((c) => (
                <a
                  key={c.title}
                  href={c.href}
                  className="ct-channel"
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <span className="ct-channel-icon">{c.icon}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                  <span className="ct-channel-cta">{c.cta} <ExternalIcon /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="ct-section ct-section--split">
          <div className="lp-wrap ct-split">
            <div>
              <h2 className="ct-h2">Quick answers</h2>
              <p className="ct-muted">The questions we get most often are already answered.</p>
              <ul className="ct-quick">
                {QUICK_ANSWERS.map((a) => (
                  <li key={a.q}>
                    <Link href={a.href}>
                      {a.q}
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ct-legal">
              <h2 className="ct-h2">Privacy &amp; legal</h2>
              <p className="ct-muted">
                How we collect, store and use your data, and the terms you agree to when you use
                Tracktar. For anything these don&apos;t cover, email us.
              </p>
              <div className="ct-legal-links">
                <Link href="/privacy-policy">Privacy policy</Link>
                <Link href="/terms-of-service">Terms of service</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
