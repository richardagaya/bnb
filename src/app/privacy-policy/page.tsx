import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Tracktar",
  description: "Privacy Policy for Tracktar.",
};

export default function PrivacyPolicyPage() {
  const privacyPolicyHTML = fs.readFileSync(
    path.join(process.cwd(), "src/content/privacy-policy.html"),
    "utf-8"
  );

  return (
    <>
      <style>{PAGE_CSS}</style>

      <header className="pp-header">
        <div className="pp-header-inner">
          <Link href="/" className="pp-logo">
            <img src="/logo.png" alt="Tracktar" className="pp-logo-img" />
          </Link>
          <nav className="pp-nav">
            <Link href="/">Home</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/tools">Tools</Link>
            <Link href="/login" className="pp-nav-cta">
              Get started free →
            </Link>
          </nav>
        </div>
      </header>

      <main className="pp-main">
        <div
          className="pp-content"
          dangerouslySetInnerHTML={{ __html: privacyPolicyHTML }}
        />
      </main>

      <footer className="pp-footer">
        <div className="pp-footer-inner">
          <Link href="/" className="pp-footer-brand">
            <img src="/logo.png" alt="Tracktar" className="pp-logo-img" />
          </Link>
          <nav className="pp-footer-links">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <p className="pp-footer-copy">© 2026 Tracktar. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  :root {
    --bg:    #0b0c10;
    --bg2:   #111318;
    --bd:    rgba(255,255,255,0.07);
    --text:  #e8e6df;
    --muted: #7a7d8a;
    --faint: #3a3d4a;
    --sage:  #81B29A;
    --sans:  'Geist', system-ui, sans-serif;
  }

  .pp-header, .pp-main, .pp-footer { font-family: var(--sans); -webkit-font-smoothing: antialiased; }
  .pp-header a, .pp-footer a { text-decoration: none; color: inherit; }

  .pp-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(11,12,16,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--bd);
    padding: 0 48px; height: 68px;
    display: flex; align-items: center;
  }
  .pp-header-inner {
    max-width: 1120px; margin: 0 auto; width: 100%;
    display: flex; align-items: center; justify-content: space-between;
  }
  .pp-logo { display: flex; align-items: center; }
  .pp-logo-img { height: 48px; width: auto; filter: brightness(0.9) saturate(0.8); }
  .pp-nav { display: flex; align-items: center; gap: 28px; }
  .pp-nav a { font-size: 13px; color: var(--muted); transition: color 0.15s; }
  .pp-nav a:hover { color: var(--text); }
  .pp-nav-cta {
    font-size: 13px; font-weight: 600;
    background: var(--sage); color: #0b0c10;
    padding: 8px 18px; border-radius: 8px;
    transition: opacity 0.15s;
  }
  .pp-nav-cta:hover { opacity: 0.88; color: #0b0c10; }

  .pp-main {
    min-height: calc(100vh - 68px);
    background: var(--bg);
    color: var(--text);
    overflow-x: clip;
  }
  .pp-content {
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
  }

  .pp-footer {
    border-top: 1px solid var(--bd);
    background: var(--bg2); padding: 28px 48px;
  }
  .pp-footer-inner {
    max-width: 1120px; margin: 0 auto;
    display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
  }
  .pp-footer-brand { margin-right: auto; }
  .pp-footer-links { display: flex; gap: 24px; }
  .pp-footer-links a { font-size: 12px; color: var(--muted); transition: color 0.15s; }
  .pp-footer-links a:hover { color: var(--text); }
  .pp-footer-copy { font-size: 12px; color: var(--faint); }

  @media (max-width: 768px) {
    .pp-header { padding: 0 16px; height: 60px; }
    .pp-logo-img { height: 40px; }
    .pp-nav { gap: 12px; }
    .pp-nav a:not(.pp-nav-cta) { display: none; }
    .pp-nav-cta { padding: 7px 14px; font-size: 12px; white-space: nowrap; }
    .pp-footer { padding: 24px 16px; }
    .pp-footer-inner {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .pp-footer-brand { margin-right: 0; }
    .pp-footer-links { flex-wrap: wrap; gap: 16px; }
  }
`;
