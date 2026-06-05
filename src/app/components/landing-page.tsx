"use client";

import { useState, useEffect, useRef } from "react";
import { saveMarketingEmail } from "@/lib/firestore";

/* ── Scroll-reveal hook ─────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Animated counter ──────────────────────────────────────────────────── */
function Counter({ to, prefix = "", suffix = "", duration = 1800 }: {
  to: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useReveal();
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * to));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, to, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── Main component ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled]       = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [videoPlaying, setVideoPlaying]   = useState(false);
  const [activeMonth, setActiveMonth]     = useState(0);
  const [mcEmail, setMcEmail]           = useState("");
  const [mcState, setMcState]           = useState<"idle" | "loading" | "done" | "error">("idle");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const NAV_LINKS = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#demo", label: "Demo" },
  ] as const;

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleMarketingEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcEmail.trim() || mcState === "loading" || mcState === "done") return;
    setMcState("loading");
    try {
      await saveMarketingEmail(mcEmail.trim(), "landing-footer");
      setMcState("done");
    } catch {
      setMcState("error");
    }
  };

  // Sticky nav
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Auto-rotate feature tabs
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(n => (n + 1) % FEATURES.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Mobile nav: Escape to close, lock body scroll while open
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen]);

  // Sections for scroll reveal
  const s1 = useReveal(), s2 = useReveal(), s3 = useReveal(),
        s4 = useReveal(), s5 = useReveal(), s6 = useReveal();

  const af = FEATURES[activeFeature];

  return (
    <>
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <nav className={`lp-nav ${scrolled ? "lp-nav--stuck" : ""}`}>
        <a href="/" className="lp-logo" onClick={closeMobileNav}>
          <img src="/logo.png" alt="Tractar" className="lp-logo-img" />
        </a>
        <ul className="lp-nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
        <a href="/login" className="lp-nav-cta lp-nav-cta--desktop">Get started free →</a>
        <button
          type="button"
          className={`lp-nav-menu-btn${mobileNavOpen ? " lp-nav-menu-btn--open" : ""}`}
          aria-expanded={mobileNavOpen}
          aria-controls="lp-mobile-nav"
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileNavOpen((v) => !v)}
        >
          <span className="lp-nav-menu-bar" />
          <span className="lp-nav-menu-bar" />
          <span className="lp-nav-menu-bar" />
        </button>
      </nav>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <>
          <div className="lp-nav-backdrop" onClick={closeMobileNav} aria-hidden="true" />
          <div
            id="lp-mobile-nav"
            className="lp-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <div className="lp-nav-drawer-head">
              <span className="lp-nav-drawer-title">Menu</span>
              <button
                type="button"
                className="lp-nav-drawer-close"
                onClick={closeMobileNav}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <ul className="lp-nav-drawer-links">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={closeMobileNav}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a href="/login" className="lp-nav-cta lp-nav-cta--drawer" onClick={closeMobileNav}>
              Get started free →
            </a>
          </div>
        </>
      )}

      {/* ── HERO ── */}
      <section className="lp-hero">
        {/* Ambient blobs */}
        <div className="blob blob-1" aria-hidden />
        <div className="blob blob-2" aria-hidden />
        <div className="blob blob-3" aria-hidden />
        <div className="lp-grid-overlay" aria-hidden />

        <div className="lp-hero-inner">
          <div className="lp-hero-left">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-dot" />
              Short-term rental intelligence
            </div>

            <h1 className="lp-headline">
              Your rental is a<br />
              <em>business.</em><br />
              Run it like one.
            </h1>

            <p className="lp-hero-sub">
              Log bookings, track expenses, sync calendars, and see your exact
              monthly profit — automatically. Everything in one clean dashboard,
              for every property you own.
            </p>

            <div className="lp-hero-actions">
              <a href="/login" className="lp-btn lp-btn-primary">
                Start for free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#demo" className="lp-btn lp-btn-ghost">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1" fill="none"/>
                  <path d="M5.5 4.5l4 2.5-4 2.5V4.5z"/>
                </svg>
                Watch demo
              </a>
            </div>

            {/* Trust badges */}
            <div className="lp-trust">
              <div className="lp-avatars">
                {["#c07a6a","#6a9c80","#c4a45a","#6a7ab8","#9a6a9c"].map((c,i) => (
                  <span key={i} className="lp-avatar" style={{ background: c }} />
                ))}
              </div>
              <span className="lp-trust-text">Built for independent hosts</span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="lp-hero-right">
            <div className="lp-mockup">
              <div className="lp-mockup-bar">
                <span className="lp-dot lp-dot-r"/><span className="lp-dot lp-dot-y"/>
                <span className="lp-dot lp-dot-g"/>
                <span className="lp-mockup-url">tracktar.com/dashboard</span>
              </div>
              <div className="lp-mockup-body">
                {/* Sidebar */}
                <div className="lp-mock-sidebar">
                  <p className="lp-mock-brand">⌂ Tractar</p>
                  <button className="lp-mock-prop lp-mock-prop-active">Downtown Loft</button>
                  <button className="lp-mock-prop">Beach Villa</button>
                  <button className="lp-mock-prop">Studio 4B</button>
                </div>
                {/* Main area */}
                <div className="lp-mock-main">
                  {/* KPI row */}
                  <div className="lp-mock-kpis">
                    {[
                      { label: "Apr profit", val: "KSh 3,840", color: "#81b29a" },
                      { label: "Bookings", val: "6", color: "#f2cc8f" },
                      { label: "Expenses", val: "KSh 2,100", color: "#e07a5f" },
                    ].map(k => (
                      <div className="lp-mock-kpi" key={k.label}>
                        <span className="lp-mock-kpi-label">{k.label}</span>
                        <span className="lp-mock-kpi-val" style={{ color: k.color }}>{k.val}</span>
                      </div>
                    ))}
                  </div>
                  {/* Calendar strip */}
                  <div className="lp-mock-cal">
                    <p className="lp-mock-sec">April 2025</p>
                    <div className="lp-mock-days">
                      {Array.from({ length: 14 }, (_, i) => i + 1).map(d => {
                        const booked = [3,4,5,6,10,11,12,13,14].includes(d);
                        return (
                          <div key={d} className={`lp-mock-day ${booked ? "lp-mock-day-booked" : ""}`}>
                            {d}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* P&L mini */}
                  <div className="lp-mock-pnl">
                    {[
                      { label: "Rent", val: "-1,800" },
                      { label: "Utilities", val: "-300" },
                      { label: "Cleaner", val: "-500" },
                    ].map(r => (
                      <div className="lp-mock-pnl-row" key={r.label}>
                        <span>{r.label}</span>
                        <span className="lp-mock-pnl-neg">{r.val}</span>
                      </div>
                    ))}
                    <div className="lp-mock-pnl-row lp-mock-pnl-profit">
                      <span>Net Profit</span>
                      <span className="lp-mock-pnl-green">+3,840</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chips */}
            <div className="lp-chip lp-chip-1">
              <span className="lp-chip-icon">✓</span>
              Calendar auto-blocked
            </div>
            <div className="lp-chip lp-chip-2">
              <span className="lp-chip-icon lp-chip-icon-amber">📋</span>
              4 bookings · KSh 8,000
            </div>
            <div className="lp-chip lp-chip-3">
              <span className="lp-chip-icon lp-chip-icon-red">⟳</span>
              iCal synced
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="lp-scroll-hint">
          <div className="lp-scroll-line"/>
          <span>scroll</span>
        </div>
      </section>

      {/* ── PLATFORM TICKER ── */}
      <div className="lp-ticker">
        <div className="lp-ticker-track">
          {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
            <span key={i} className="lp-ticker-item">
              <span className="lp-ticker-dot" style={{ background: p.color }} />
              {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ROW ── */}
      {STATS.length > 0 && (
        <div className="lp-stats-row" ref={s1.ref}>
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`lp-stat ${s1.visible ? "lp-stat--in" : ""}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="lp-stat-val">
                {s.prefix}
                {s1.visible && <Counter to={s.to} duration={1600} />}
                {s.suffix}
              </span>
              <span className="lp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features" ref={s2.ref}>
        <div className="lp-section-head">
          <span className="lp-tag">What it does</span>
          <h2 className="lp-section-title">
            Everything a host needs.<br />
            <em>Nothing they don't.</em>
          </h2>
          <p className="lp-section-sub">
            Built around how short-term rental businesses actually run —
            month by month, booking by booking.
          </p>
        </div>

        <div className={`lp-feat-layout ${s2.visible ? "lp-revealed" : ""}`}>
          {/* Tab list */}
          <div className="lp-feat-tabs">
            {FEATURES.map((f, i) => (
              <button
                key={f.title}
                className={`lp-feat-tab ${activeFeature === i ? "lp-feat-tab--active" : ""}`}
                onClick={() => setActiveFeature(i)}
                style={activeFeature === i ? { borderColor: f.color, color: f.color } : {}}
              >
                <span className="lp-feat-tab-icon" style={activeFeature === i ? { background: `${f.color}22` } : {}}>
                  {f.icon}
                </span>
                <span>{f.title}</span>
                {activeFeature === i && (
                  <span className="lp-feat-tab-bar" style={{ background: f.color }} />
                )}
              </button>
            ))}
          </div>

          {/* Active feature panel */}
          <div className="lp-feat-panel" style={{ borderColor: `${af.color}33` }}>
            <div className="lp-feat-panel-left">
              <div className="lp-feat-panel-icon" style={{ background: `${af.color}18`, color: af.color }}>
                {af.icon}
              </div>
              <h3 className="lp-feat-panel-title">{af.title}</h3>
              <p className="lp-feat-panel-body">{af.body}</p>
              <ul className="lp-feat-panel-bullets">
                {af.bullets.map(b => (
                  <li key={b}>
                    <span className="lp-feat-bullet-dot" style={{ background: af.color }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-feat-panel-right">
              <div className="lp-feat-preview" style={{ borderColor: `${af.color}22` }}>
                {af.preview}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO DEMO ── */}
      <section className="lp-video-section" id="demo" ref={s3.ref}>
        <div className={`lp-video-inner ${s3.visible ? "lp-revealed" : ""}`}>
          <span className="lp-tag">See it in action</span>
          <h2 className="lp-section-title">
            From setup to profit report<br />in under 10 minutes.
          </h2>

          <div className="lp-video-frame">
            {!videoPlaying ? (
              <>
                {/* Thumbnail / placeholder */}
                <div className="lp-video-thumb">
                  <div className="lp-video-thumb-bg">
                    {/* Animated dashboard mockup as thumbnail */}
                    <div className="lp-vthumb-header">
                      <div className="lp-vthumb-dots">
                        <span/><span/><span/>
                      </div>
                      <span className="lp-vthumb-url">tracktar.com/dashboard</span>
                    </div>
                    <div className="lp-vthumb-body">
                      <div className="lp-vthumb-sidebar">
                        <div className="lp-vthumb-brand">⌂ Tractar</div>
                        <div className="lp-vthumb-prop lp-vthumb-prop-active">Downtown Loft</div>
                        <div className="lp-vthumb-prop">Beach Villa</div>
                        <div className="lp-vthumb-prop">Studio 4B</div>
                      </div>
                      <div className="lp-vthumb-main">
                        <div className="lp-vthumb-kpis">
                          {["Monthly P&L","Bookings","Calendar","Expenses"].map(t => (
                            <div key={t} className="lp-vthumb-tab">{t}</div>
                          ))}
                        </div>
                        <div className="lp-vthumb-months">
                          {[
                            { m: "Feb", r: 6200, c: 4800, p: 1400 },
                            { m: "Mar", r: 7400, c: 5200, p: 2200 },
                            { m: "Apr", r: 9800, c: 5900, p: 3900 },
                          ].map(row => (
                            <div className="lp-vthumb-month-row" key={row.m}>
                              <span className="lp-vthumb-month-name">{row.m}</span>
                              <div className="lp-vthumb-month-bar-wrap">
                                <div className="lp-vthumb-month-bar lp-vthumb-bar-rev" style={{ width: `${(row.r/10000)*100}%` }} />
                              </div>
                              <span className="lp-vthumb-month-pnl" style={{ color: "#81b29a" }}>+{row.p.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Play button overlay */}
                  <button className="lp-play-btn" onClick={() => setVideoPlaying(true)}>
                    <div className="lp-play-ring" />
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="white">
                      <path d="M10 7l14 7-14 7V7z"/>
                    </svg>
                  </button>
                  <div className="lp-video-label">
                    <span className="lp-video-label-dot" />
                    Product walkthrough · 3 min
                  </div>
                </div>
              </>
            ) : (
              <iframe
                className="lp-video-iframe"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1"
                title="Tractar product demo"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            )}
          </div>

          <div className="lp-video-points">
            {VIDEO_POINTS.map((p, i) => (
              <div key={i} className="lp-video-point">
                <span className="lp-video-point-icon">{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MONTHLY P&L SHOWCASE ── */}
      <section className="lp-pnl-section" ref={s4.ref}>
        <div className={`lp-pnl-inner ${s4.visible ? "lp-revealed" : ""}`}>
          <div className="lp-pnl-left">
            <span className="lp-tag">Monthly P&amp;L History</span>
            <h2 className="lp-section-title" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
              Every month, saved.<br />Your business story<br />in one scroll.
            </h2>
            <p className="lp-pnl-sub">
              Each month is stored automatically. Bookings collected, rent,
              utilities, cleaner fees, and every logged expense summed into
              a single profit figure. Click any month to see the full breakdown.
            </p>
            <div className="lp-pnl-bullets">
              {["Bookings auto-deduct from revenue", "Fixed costs (rent · utilities · cleaner) always included",
                "Expenses logged per month, grouped by category",
                "Profit margin and break-even hints per month"].map(b => (
                <div key={b} className="lp-pnl-bullet">
                  <span className="lp-pnl-bullet-check">✓</span>
                  {b}
                </div>
              ))}
            </div>
          </div>

          <div className="lp-pnl-right">
            {/* Animated monthly cards */}
            <div className="lp-months-demo">
              <div className="lp-months-header">Monthly P&amp;L History</div>
              {DEMO_MONTHS.map((m, i) => (
                <div
                  key={m.name}
                  className={`lp-month-card ${activeMonth === i ? "lp-month-card-open" : ""}`}
                  style={activeMonth === i ? { borderColor: "#81b29a44" } : {}}
                  onClick={() => setActiveMonth(activeMonth === i ? -1 : i)}
                >
                  <div className="lp-month-head">
                    <div className="lp-month-head-left">
                      <span className="lp-month-name">{m.name}</span>
                      {i === 0 && <span className="lp-month-badge">Current</span>}
                      <span className="lp-month-bk">{m.bookings} bookings</span>
                    </div>
                    <div className="lp-month-head-right">
                      <span className="lp-month-rev">{m.revenue}</span>
                      <span className="lp-month-dash">−</span>
                      <span className="lp-month-cost">{m.costs}</span>
                      <span className="lp-month-dash">=</span>
                      <span className="lp-month-profit" style={{ color: "#81b29a" }}>{m.profit}</span>
                      <span className="lp-month-chevron">{activeMonth === i ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {activeMonth === i && (
                    <div className="lp-month-body">
                      <div className="lp-month-detail-row">
                        <span>Revenue ({m.bookings} bookings)</span>
                        <span className="lp-month-green">{m.revenue}</span>
                      </div>
                      <div className="lp-month-detail-row">
                        <span>Rent</span>
                        <span className="lp-month-red">−KSh 1,800</span>
                      </div>
                      <div className="lp-month-detail-row">
                        <span>Utilities</span>
                        <span className="lp-month-red">−KSh 300</span>
                      </div>
                      <div className="lp-month-detail-row">
                        <span>Cleaner</span>
                        <span className="lp-month-red">−KSh 500</span>
                      </div>
                      <div className="lp-month-detail-row lp-month-detail-total">
                        <span>Net Profit</span>
                        <span className="lp-month-green">{m.profit}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="lp-months-footer">
                <span>All-time revenue: KSh 31,400</span>
                <span className="lp-months-profit">All-time profit: KSh 18,240</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how" id="how" ref={s5.ref}>
        <div className={`lp-how-inner ${s5.visible ? "lp-revealed" : ""}`}>
          <span className="lp-tag">How it works</span>
          <h2 className="lp-section-title">
            Up and running<br />in 4 steps.
          </h2>

          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="lp-step" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="lp-step-num">
                  <span>{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && <div className="lp-step-line" />}
                <div className="lp-step-icon">{s.icon}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ICAL CALLOUT ── */}
      <section className="lp-ical-section" ref={s6.ref}>
        <div className={`lp-ical-inner ${s6.visible ? "lp-revealed" : ""}`}>
          <div className="lp-ical-left">
            <span className="lp-tag lp-tag-blue">iCal Sync</span>
            <h2 className="lp-section-title" style={{ fontSize: "clamp(26px,2.8vw,38px)" }}>
              Paste a link.<br />Your bookings<br />appear instantly.
            </h2>
            <p className="lp-ical-body">
              Copy the iCal export URL from Airbnb, Booking.com, or VRBO.
              Tractar fetches it on the server, parses every reservation,
              and drops them straight into your calendar and monthly P&amp;L —
              no manual entry, no duplicates, no CORS headaches.
            </p>
            <div className="lp-ical-platforms">
              {PLATFORMS.map(p => (
                <div key={p.name} className="lp-ical-platform"
                  style={{ borderColor: `${p.color}44`, background: `${p.color}10` }}>
                  <span className="lp-ical-platform-dot" style={{ background: p.color }} />
                  <span style={{ color: p.color }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-ical-right">
            <div className="lp-ical-card">
              <div className="lp-ical-card-header">
                <span>iCal Sync</span>
                <span className="lp-ical-card-tag">✓ Real-time</span>
              </div>
              {[
                { platform: "Airbnb", url: "airbnb.com/calendar/ical/…", status: "synced", count: 4, color: "#FF5A5F" },
                { platform: "Booking.com", url: "booking.com/hotel/ical/…", status: "synced", count: 2, color: "#4A7FBF" },
                { platform: "Direct", url: "manual bookings", status: "synced", count: 1, color: "#81B29A" },
              ].map(src => (
                <div key={src.platform} className="lp-ical-src">
                  <div className="lp-ical-src-left">
                    <span className="lp-ical-src-dot" style={{ background: src.color }} />
                    <div>
                      <div className="lp-ical-src-name" style={{ color: src.color }}>{src.platform}</div>
                      <div className="lp-ical-src-url">{src.url}</div>
                    </div>
                  </div>
                  <div className="lp-ical-src-right">
                    <span className="lp-ical-src-count">{src.count} bookings</span>
                    <span className="lp-ical-src-status">✓ Synced</span>
                  </div>
                </div>
              ))}
              <div className="lp-ical-result">
                <span>✓ 7 bookings imported · 0 duplicates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-finale">
        <div className="lp-finale-blob" aria-hidden />
        <div className="lp-finale-inner">
          <div className="lp-finale-badge">Free to start · No credit card</div>
          <h2 className="lp-finale-headline">
            Know your numbers.<br />
            <em>Every month.</em>
          </h2>
          <p className="lp-finale-sub">
            Stop guessing. Start knowing your real monthly profit.
          </p>
          <a href="/login" className="lp-btn lp-btn-primary lp-btn-xl">
            Create your free account
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <p className="lp-finale-note">
            Set up takes under 5 minutes. Your first monthly report is instant.
          </p>
        </div>
      </section>

      {/* ── FLOATING FEEDBACK ── */}
      <a
        href="https://forms.gle/AtsJdJV4RC4Co6HG6"
        target="_blank"
        rel="noopener noreferrer"
        className="lp-feedback-fab"
        title="Share your feedback"
      >
        💬 <span>Feedback</span>
      </a>

      {/* ── MARKETING EMAIL CAPTURE ── */}
      <section className="lp-mc-section">
        <div className="lp-mc-inner">
          <div className="lp-mc-text">
            <p className="lp-mc-eyebrow">Stay in the loop</p>
            <h3 className="lp-mc-heading">Get tips, updates &amp; feature releases</h3>
            <p className="lp-mc-sub">No spam. Unsubscribe any time.</p>
          </div>
          <form className="lp-mc-form" onSubmit={handleMarketingEmail}>
            {mcState === "done" ? (
              <div className="lp-mc-success">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#81B29A" strokeWidth="1.5"/>
                  <path d="M5 8l2.5 2.5L11 5.5" stroke="#81B29A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                You&apos;re on the list — thanks!
              </div>
            ) : (
              <>
                <input
                  type="email"
                  required
                  className="lp-mc-input"
                  placeholder="your@email.com"
                  value={mcEmail}
                  onChange={(e) => { setMcEmail(e.target.value); if (mcState === "error") setMcState("idle"); }}
                  disabled={mcState === "loading"}
                />
                <button type="submit" className="lp-mc-btn" disabled={mcState === "loading"}>
                  {mcState === "loading" ? "Saving…" : "Notify me"}
                </button>
              </>
            )}
            {mcState === "error" && (
              <p className="lp-mc-error">Something went wrong — please try again.</p>
            )}
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src="/logo.png" alt="Tractar" className="lp-logo-img lp-logo-img--footer" />
          </div>
          <nav className="lp-footer-links">
            <a href="/privacy-policy">Privacy</a>
            <a href="/terms-of-service">Terms</a>
            <a href="/contact">Contact</a>
          </nav>
          <p className="lp-footer-copy">© 2026 Tractar. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

/* ── DATA ────────────────────────────────────────────────────────────────── */

const PLATFORMS = [
  { name: "Airbnb",      color: "#FF5A5F" },
  { name: "Booking.com", color: "#4A7FBF" },
  { name: "VRBO",        color: "#1A8FFF" },
  { name: "Expedia",     color: "#FFC72C" },
  { name: "TripAdvisor", color: "#34E0A1" },
  { name: "Agoda",       color: "#E8000B" },
];

type LandingStat = {
  label: string;
  to: number;
  prefix?: string;
  suffix?: string;
};

const STATS: LandingStat[] = [
  // Intentionally empty: avoid showing placeholder / unverified stats on the landing page.
];

const FEATURES = [
  {
    icon: "📋",
    title: "Bookings Tracker",
    color: "#81B29A",
    body: "Log every reservation: guest name, check-in/out, source, payment status, discounts given, and notes. All in one place.",
    bullets: [
      "Track Airbnb, Booking.com, Direct, Walk-in, WhatsApp bookings",
      "Mark paid, partial, or outstanding payments",
      "Log discounts per guest — shows in monthly P&L",
      "Guest notes for each booking",
    ],
    preview: (
      <div className="lp-prev-bookings">
        {[
          { guest: "Alice Kamau", nights: 3, src: "Airbnb", paid: "KSh 2,400", status: "paid" },
          { guest: "Bob Mwangi", nights: 5, src: "Direct", paid: "KSh 3,800", status: "partial" },
          { guest: "Chen Lin", nights: 2, src: "Booking.com", paid: "KSh 1,600", status: "paid" },
        ].map(b => (
          <div key={b.guest} className="lp-prev-bk-row">
            <div className="lp-prev-bk-left">
              <span className="lp-prev-bk-guest">{b.guest}</span>
              <span className="lp-prev-bk-meta">{b.nights}n · {b.src}</span>
            </div>
            <div className="lp-prev-bk-right">
              <span className="lp-prev-bk-amt">{b.paid}</span>
              <span className={`lp-prev-bk-status lp-prev-bk-${b.status}`}>
                {b.status}
              </span>
            </div>
          </div>
        ))}
        <div className="lp-prev-bk-total">
          <span>3 bookings collected</span>
          <span className="lp-prev-bk-total-val">KSh 7,800</span>
        </div>
      </div>
    ),
  },
  {
    icon: "📅",
    title: "Auto-blocking Calendar",
    color: "#E07A5F",
    body: "Every booking you add immediately blocks those dates on the visual calendar. No double-booking ever. Sync iCal feeds to import external reservations too.",
    bullets: [
      "Check-in/out dates colored by booking source",
      "Month navigation with upcoming check-ins strip",
      "Hover any day to see guest name and source",
      "iCal sync imports Airbnb & Booking.com bookings",
    ],
    preview: (
      <div className="lp-prev-cal">
        <div className="lp-prev-cal-nav">
          <span>‹</span>
          <span className="lp-prev-cal-month">April 2025</span>
          <span>›</span>
        </div>
        <div className="lp-prev-cal-dow">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <span key={d} className="lp-prev-cal-dow-item">{d}</span>
          ))}
        </div>
        <div className="lp-prev-cal-grid">
          {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
            const airbnb  = d >= 3  && d <= 6;
            const direct  = d >= 10 && d <= 14;
            const booking = d >= 22 && d <= 25;
            const color   = airbnb ? "#FF5A5F" : direct ? "#81B29A" : booking ? "#4A7FBF" : null;
            const isCI = d === 3 || d === 10 || d === 22;
            const isCO = d === 6 || d === 14 || d === 25;
            return (
              <div key={d}
                className={`lp-prev-day ${color ? "lp-prev-day-bk" : ""} ${isCI ? "lp-prev-day-ci" : ""} ${isCO ? "lp-prev-day-co" : ""}`}
                style={color ? { "--dc": color } as React.CSSProperties : {}}>
                {d}
              </div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    icon: "🧾",
    title: "Monthly Expense Tracker",
    color: "#F2CC8F",
    body: "Log every cost to the right month. Navigate between months, see category breakdowns, and watch them flow directly into your monthly P&L.",
    bullets: [
      "Month-by-month navigation (Apr 2025, Mar 2025…)",
      "Category breakdown: Cleaning, Utilities, Repairs, Supplies…",
      "Recurring vs one-time expenses tracked separately",
      "All logged expenses deducted automatically in Summary",
    ],
    preview: (
      <div className="lp-prev-expenses">
        <div className="lp-prev-exp-nav">
          <span>‹</span>
          <span className="lp-prev-exp-month">April 2025</span>
          <span>›</span>
        </div>
        <div className="lp-prev-exp-stats">
          <div className="lp-prev-exp-stat">
            <span className="lp-prev-exp-stat-val">KSh 1,840</span>
            <span className="lp-prev-exp-stat-label">Total this month</span>
          </div>
          <div className="lp-prev-exp-stat">
            <span className="lp-prev-exp-stat-val">7</span>
            <span className="lp-prev-exp-stat-label">Entries</span>
          </div>
        </div>
        {[
          { cat: "Cleaning", amt: 800, pct: 80 },
          { cat: "Utilities", amt: 450, pct: 45 },
          { cat: "Supplies", amt: 350, pct: 35 },
          { cat: "Repairs", amt: 240, pct: 24 },
        ].map(e => (
          <div key={e.cat} className="lp-prev-exp-row">
            <div className="lp-prev-exp-row-top">
              <span>{e.cat}</span>
              <span className="lp-prev-exp-amt">KSh {e.amt}</span>
            </div>
            <div className="lp-prev-exp-bar">
              <div className="lp-prev-exp-fill" style={{ width: `${e.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "📊",
    title: "P&L History",
    color: "#6c7ab8",
    body: "Every month is saved automatically. Click any month to see the full breakdown: revenue from each booking, fixed costs, expenses, discounts given, and net profit.",
    bullets: [
      "All-time revenue, expenses and profit totals",
      "Per-month cards collapse/expand",
      "Profit margin % and break-even hints",
      "Discounts given shown separately",
    ],
    preview: (
      <div className="lp-prev-pnl">
        {[
          { m: "April 2025", bk: 4, rev: "KSh 9,800", profit: "+KSh 3,900", open: true },
          { m: "March 2025", bk: 3, rev: "KSh 7,400", profit: "+KSh 2,200", open: false },
          { m: "February 2025", bk: 2, rev: "KSh 6,200", profit: "+KSh 1,400", open: false },
        ].map(row => (
          <div key={row.m} className={`lp-prev-pnl-card ${row.open ? "lp-prev-pnl-open" : ""}`}>
            <div className="lp-prev-pnl-head">
              <span className="lp-prev-pnl-month">{row.m}</span>
              <span className="lp-prev-pnl-bk">{row.bk} bookings</span>
              <span className="lp-prev-pnl-profit">{row.profit}</span>
            </div>
            {row.open && (
              <div className="lp-prev-pnl-body">
                <div className="lp-prev-pnl-row">
                  <span>Revenue</span><span className="lp-green">{row.rev}</span>
                </div>
                <div className="lp-prev-pnl-row">
                  <span>Fixed costs</span><span className="lp-red">−KSh 2,600</span>
                </div>
                <div className="lp-prev-pnl-row">
                  <span>Expenses</span><span className="lp-red">−KSh 1,840</span>
                </div>
                <div className="lp-prev-pnl-row lp-prev-pnl-total">
                  <span>Net Profit</span><span className="lp-green">{row.profit}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    ),
  },
];

const STEPS = [
  {
    icon: "🏠",
    title: "Add your property",
    body: "Name it, pick a type and colour. 30 seconds. Add as many properties as you have.",
  },
  {
    icon: "💰",
    title: "Set up Financials",
    body: "Enter your nightly rate, platform fee %, projected stays, rent, utilities, and cleaner cost.",
  },
  {
    icon: "📋",
    title: "Log bookings & expenses",
    body: "Add bookings as they come in. Log expenses to the right month. Or sync your iCal feed to import automatically.",
  },
  {
    icon: "📊",
    title: "See your monthly P&L",
    body: "Your profit, broken down to the cent. Every month, saved forever. Click any month to see the full story.",
  },
];

const VIDEO_POINTS = [
  { icon: "⚡", text: "Full walkthrough in 3 minutes" },
  { icon: "📅", text: "Calendar auto-blocking demo" },
  { icon: "📊", text: "Monthly P&L live calculation" },
  { icon: "⟳", text: "iCal sync from Airbnb" },
];

const DEMO_MONTHS = [
  { name: "April 2025",    bookings: 4, revenue: "KSh 9,800", costs: "KSh 5,900", profit: "KSh 3,900" },
  { name: "March 2025",    bookings: 3, revenue: "KSh 7,400", costs: "KSh 5,200", profit: "KSh 2,200" },
  { name: "February 2025", bookings: 2, revenue: "KSh 6,200", costs: "KSh 4,800", profit: "KSh 1,400" },
];

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:    #0b0c10;
    --bg2:   #111318;
    --bg3:   #181a21;
    --bd:    rgba(255,255,255,0.07);
    --bd2:   rgba(255,255,255,0.13);
    --text:  #e8e6df;
    --muted: #7a7d8a;
    --faint: #3a3d4a;
    --sage:  #81B29A;
    --amber: #F2CC8F;
    --coral: #E07A5F;
    --blue:  #6c7ab8;
    --serif: 'Instrument Serif', Georgia, serif;
    --sans:  'Geist', system-ui, sans-serif;
    --mono:  'Geist Mono', monospace;
  }

  html { scroll-behavior: smooth; }
  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* ── Scroll reveal ── */
  .lp-revealed > * { animation: lp-fade-up 0.7s both; }
  .lp-revealed > *:nth-child(1) { animation-delay: 0.05s; }
  .lp-revealed > *:nth-child(2) { animation-delay: 0.15s; }
  .lp-revealed > *:nth-child(3) { animation-delay: 0.25s; }
  .lp-revealed > *:nth-child(4) { animation-delay: 0.35s; }
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 500;
    display: flex; align-items: center; justify-content: space-between;
    height: 74px;
    padding: 0 48px;
    background: rgba(247,244,236,0.98);
    border-bottom: 1px solid rgba(61,64,91,0.12);
    transition: background 0.3s, box-shadow 0.3s, padding 0.25s;
  }
  .lp-nav--stuck {
    background: rgba(247,244,236,0.98);
    box-shadow: 0 2px 16px rgba(61,64,91,0.10);
    padding: 0 48px;
  }
  .lp-logo {
    display: flex; align-items: center;
    text-decoration: none;
  }
  .lp-logo-img {
    height: 60px; width: auto; display: block;
    filter: brightness(0.3) contrast(2) saturate(2);
  }
  .lp-logo-img--footer {
    height: 60px;
    filter: brightness(0.3) contrast(2) saturate(2);
  }
  .lp-nav-links {
    list-style: none; display: flex; gap: 32px;
  }
  .lp-nav-links a {
    font-size: 13px; color: #555; text-decoration: none; transition: color 0.15s;
  }
  .lp-nav-links a:hover { color: #111; }
  .lp-nav-cta {
    font-size: 13px; font-weight: 600;
    background: var(--sage); color: #0b0c10;
    padding: 9px 20px; border-radius: 8px;
    text-decoration: none; transition: opacity 0.15s, transform 0.1s;
    letter-spacing: -0.1px;
  }
  .lp-nav-cta:hover { opacity: 0.88; transform: translateY(-1px); }

  /* Mobile menu button — hidden on desktop */
  .lp-nav-menu-btn {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    padding: 10px;
    background: transparent;
    border: 1px solid rgba(61,64,91,0.2);
    border-radius: 10px;
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color 0.15s, background 0.15s;
  }
  .lp-nav-menu-btn:hover { background: rgba(61,64,91,0.06); border-color: rgba(61,64,91,0.35); }
  .lp-nav-menu-btn:focus-visible {
    outline: 2px solid var(--sage);
    outline-offset: 2px;
  }
  .lp-nav-menu-bar {
    display: block;
    width: 20px;
    height: 2px;
    background: #333;
    border-radius: 1px;
    transition: transform 0.2s, opacity 0.2s;
  }
  .lp-nav-menu-btn--open .lp-nav-menu-bar:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }
  .lp-nav-menu-btn--open .lp-nav-menu-bar:nth-child(2) {
    opacity: 0;
  }
  .lp-nav-menu-btn--open .lp-nav-menu-bar:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  .lp-nav-backdrop {
    position: fixed;
    inset: 0;
    z-index: 501;
    background: rgba(11, 12, 16, 0.55);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    animation: lp-nav-fade-in 0.2s ease both;
  }
  .lp-nav-drawer {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 502;
    width: min(320px, 88vw);
    height: 100%;
    max-height: 100dvh;
    background: rgba(247,244,236,0.99);
    border-left: 1px solid rgba(61,64,91,0.15);
    box-shadow: -8px 0 40px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    padding: 20px 24px 28px;
    animation: lp-nav-slide-in 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  @keyframes lp-nav-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes lp-nav-slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .lp-nav-drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(61,64,91,0.12);
  }
  .lp-nav-drawer-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #888;
  }
  .lp-nav-drawer-close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(61,64,91,0.08);
    border: 1px solid rgba(61,64,91,0.15);
    border-radius: 8px;
    color: #555;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .lp-nav-drawer-close:hover { background: rgba(61,64,91,0.14); color: #111; }
  .lp-nav-drawer-close:focus-visible {
    outline: 2px solid var(--sage);
    outline-offset: 2px;
  }
  .lp-nav-drawer-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    margin: 0;
    padding: 0;
  }
  .lp-nav-drawer-links a {
    display: block;
    padding: 14px 12px;
    font-size: 16px;
    font-weight: 500;
    color: #333;
    text-decoration: none;
    border-radius: 8px;
    transition: background 0.15s, color 0.15s;
  }
  .lp-nav-drawer-links a:hover {
    background: rgba(129,178,154,0.12);
    color: #111;
  }
  .lp-nav-drawer-links a:focus-visible {
    outline: 2px solid var(--sage);
    outline-offset: 2px;
  }
  .lp-nav-cta--drawer {
    display: none;
    margin-top: 16px;
    text-align: center;
    justify-content: center;
    width: 100%;
    padding: 14px 20px;
    font-size: 15px;
  }

  /* ── HERO ── */
  .lp-hero {
    min-height: 100vh;
    padding: 140px 48px 80px;
    display: flex; flex-direction: column; justify-content: center;
    position: relative; overflow: hidden;
  }
  .lp-hero-inner {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 64px; align-items: center;
  }

  /* Ambient blobs */
  .blob {
    position: absolute; border-radius: 50%;
    filter: blur(100px); pointer-events: none; opacity: 0.5;
    animation: blob-drift 10s ease-in-out infinite alternate;
  }
  .blob-1 { width: 500px; height: 500px; background: rgba(129,178,154,0.18); top: -100px; left: -100px; animation-duration: 12s; }
  .blob-2 { width: 400px; height: 400px; background: rgba(108,122,184,0.15); top: 40%; right: -80px; animation-duration: 9s; animation-delay: -3s; }
  .blob-3 { width: 350px; height: 350px; background: rgba(224,122,95,0.1); bottom: -60px; left: 40%; animation-duration: 14s; animation-delay: -6s; }
  @keyframes blob-drift {
    from { transform: translate(0, 0) scale(1); }
    to   { transform: translate(30px, 40px) scale(1.1); }
  }
  .lp-grid-overlay {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 30%, transparent 100%);
    pointer-events: none;
  }

  /* Hero left */
  .lp-hero-left { position: relative; z-index: 1; }
  .lp-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--sage); margin-bottom: 24px;
  }
  .lp-eyebrow-dot {
    width: 6px; height: 6px; background: var(--sage);
    border-radius: 50%; animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }
  .lp-headline {
    font-family: var(--serif);
    font-size: clamp(46px, 5.5vw, 70px);
    line-height: 1.03; color: var(--text);
    margin-bottom: 22px; letter-spacing: -0.5px;
  }
  .lp-headline em {
    color: var(--sage); font-style: normal;
    text-decoration: underline; text-decoration-color: rgba(129,178,154,0.35);
    text-underline-offset: 4px;
  }
  .lp-hero-sub {
    font-size: 15px; color: var(--muted); line-height: 1.75;
    max-width: 440px; margin-bottom: 36px;
  }
  .lp-hero-actions {
    display: flex; align-items: center; gap: 12px; margin-bottom: 36px;
  }
  .lp-trust { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--muted); }
  .lp-avatars { display: flex; }
  .lp-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid var(--bg); margin-left: -8px;
  }
  .lp-avatar:first-child { margin-left: 0; }
  .lp-trust-text { font-size: 12px; color: var(--faint); }

  /* ── Buttons ── */
  .lp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 10px;
    font-family: var(--sans); font-size: 14px; font-weight: 600;
    text-decoration: none; cursor: pointer; border: 1.5px solid transparent;
    transition: all 0.18s; letter-spacing: -0.1px;
  }
  .lp-btn:active { transform: scale(0.97); }
  .lp-btn-primary { background: var(--sage); color: #0b0c10; border-color: var(--sage); }
  .lp-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(129,178,154,0.25); }
  .lp-btn-ghost { background: rgba(255,255,255,0.05); color: var(--muted); border-color: var(--bd2); }
  .lp-btn-ghost:hover { color: var(--text); border-color: var(--bd2); background: rgba(255,255,255,0.09); }
  .lp-btn-xl { font-size: 16px; padding: 16px 36px; border-radius: 12px; }

  /* ── Mockup ── */
  .lp-hero-right { position: relative; z-index: 1; }
  .lp-mockup {
    background: var(--bg2); border: 1px solid var(--bd2);
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
  }
  .lp-mockup-bar {
    background: #08090c; padding: 10px 16px;
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid var(--bd);
  }
  .lp-dot { width: 9px; height: 9px; border-radius: 50%; }
  .lp-dot-r { background: #FF5F57; }
  .lp-dot-y { background: #FEBC2E; }
  .lp-dot-g { background: #28C840; }
  .lp-mockup-url { font-family: var(--mono); font-size: 10px; color: var(--faint); margin-left: 4px; }
  .lp-mockup-body { display: flex; min-height: 260px; }
  .lp-mock-sidebar {
    width: 110px; background: #080a0e;
    border-right: 1px solid var(--bd); padding: 14px 10px; flex-shrink: 0;
  }
  .lp-mock-brand {
    font-size: 9px; font-weight: 700; color: var(--text); opacity: 0.6;
    padding: 0 6px 10px; margin-bottom: 6px; border-bottom: 1px solid var(--bd);
  }
  .lp-mock-prop {
    display: block; width: 100%; padding: 6px 8px; background: none; border: none;
    border-radius: 5px; font-family: var(--sans); font-size: 9px; color: var(--muted);
    text-align: left; cursor: default; margin-bottom: 2px;
  }
  .lp-mock-prop-active { background: rgba(129,178,154,0.12); color: var(--sage); }
  .lp-mock-main { flex: 1; padding: 14px; }
  .lp-mock-kpis { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 10px; }
  .lp-mock-kpi {
    background: var(--bg3); border: 1px solid var(--bd); border-radius: 7px; padding: 8px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .lp-mock-kpi-label { font-size: 7px; color: var(--faint); }
  .lp-mock-kpi-val { font-size: 11px; font-weight: 700; font-family: var(--mono); }
  .lp-mock-cal {
    background: var(--bg3); border: 1px solid var(--bd); border-radius: 7px; padding: 10px; margin-bottom: 8px;
  }
  .lp-mock-sec { font-size: 7px; color: var(--faint); margin-bottom: 6px; }
  .lp-mock-days { display: flex; gap: 3px; flex-wrap: wrap; }
  .lp-mock-day {
    width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
    font-size: 7px; color: var(--muted); border-radius: 50%;
  }
  .lp-mock-day-booked { background: rgba(129,178,154,0.3); color: var(--sage); }
  .lp-mock-pnl { background: var(--bg3); border: 1px solid var(--bd); border-radius: 7px; padding: 10px; }
  .lp-mock-pnl-row {
    display: flex; justify-content: space-between; font-size: 8px; color: var(--muted); margin-bottom: 4px;
  }
  .lp-mock-pnl-neg { color: var(--coral); font-family: var(--mono); }
  .lp-mock-pnl-green { color: var(--sage); font-family: var(--mono); }
  .lp-mock-pnl-profit { font-weight: 700; color: var(--text); border-top: 1px solid var(--bd); padding-top: 4px; margin-top: 4px; margin-bottom: 0; }

  /* Floating chips */
  .lp-chip {
    position: absolute; background: var(--bg2); border: 1px solid var(--bd2);
    border-radius: 10px; padding: 8px 14px; font-size: 12px; font-weight: 500; color: var(--text);
    display: flex; align-items: center; gap: 7px; white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    animation: chip-float 4s ease-in-out infinite;
  }
  .lp-chip-icon { font-size: 13px; color: var(--sage); }
  .lp-chip-icon-amber { color: var(--amber); }
  .lp-chip-icon-red { color: var(--coral); }
  .lp-chip-1 { bottom: -16px; left: -30px; animation-delay: 0s; }
  .lp-chip-2 { top: -14px; right: -20px; animation-delay: 1.5s; animation-duration: 3.5s; }
  .lp-chip-3 { bottom: 40px; right: -30px; animation-delay: 0.8s; animation-duration: 5s; }
  @keyframes chip-float {
    0%, 100% { transform: translateY(0) rotate(-1deg); }
    50% { transform: translateY(-8px) rotate(1deg); }
  }

  /* Scroll hint */
  .lp-scroll-hint {
    position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    font-size: 10px; color: var(--faint); letter-spacing: 1.5px; text-transform: uppercase;
    animation: scroll-bob 2s ease-in-out infinite;
  }
  .lp-scroll-line {
    width: 1px; height: 40px; background: linear-gradient(to bottom, var(--faint), transparent);
  }
  @keyframes scroll-bob {
    0%, 100% { opacity: 0.5; transform: translateX(-50%) translateY(0); }
    50% { opacity: 1; transform: translateX(-50%) translateY(6px); }
  }

  /* ── TICKER ── */
  .lp-ticker {
    border-top: 1px solid var(--bd); border-bottom: 1px solid var(--bd);
    overflow: hidden; padding: 0;
    background: var(--bg2);
  }
  .lp-ticker-track {
    display: flex; gap: 0; width: max-content;
    animation: ticker-scroll 22s linear infinite;
  }
  .lp-ticker:hover .lp-ticker-track { animation-play-state: paused; }
  @keyframes ticker-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .lp-ticker-item {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 32px; font-size: 13px; font-weight: 500; color: var(--muted);
    white-space: nowrap; border-right: 1px solid var(--bd);
    transition: color 0.2s;
  }
  .lp-ticker-item:hover { color: var(--text); }
  .lp-ticker-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  /* ── STATS ── */
  .lp-stats-row {
    display: grid; grid-template-columns: repeat(4, 1fr);
    max-width: 1160px; margin: 0 auto; padding: 60px 48px;
    gap: 0; border-bottom: 1px solid var(--bd);
  }
  .lp-stat {
    padding: 0 32px; border-right: 1px solid var(--bd);
    opacity: 0; animation: none;
    display: flex; flex-direction: column; gap: 6px;
  }
  .lp-stat:first-child { padding-left: 0; }
  .lp-stat:last-child { border-right: none; }
  .lp-stat--in { opacity: 1; animation: lp-fade-up 0.7s both; }
  .lp-stat-val { font-family: var(--mono); font-size: 36px; color: var(--text); font-weight: 400; letter-spacing: -1px; }
  .lp-stat-label { font-size: 12px; color: var(--muted); }

  /* ── SHARED SECTION STYLES ── */
  .lp-tag {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 600; letter-spacing: 1.3px;
    text-transform: uppercase; color: var(--sage);
    background: rgba(129,178,154,0.08); border: 1px solid rgba(129,178,154,0.2);
    padding: 4px 12px; border-radius: 4px; margin-bottom: 20px;
  }
  .lp-tag-blue { color: var(--blue); background: rgba(108,122,184,0.08); border-color: rgba(108,122,184,0.2); }
  .lp-section-head { text-align: center; margin-bottom: 56px; }
  .lp-section-title {
    font-family: var(--serif);
    font-size: clamp(32px, 3.8vw, 52px);
    line-height: 1.08; color: var(--text);
    margin-bottom: 16px; letter-spacing: -0.4px;
  }
  .lp-section-title em { color: var(--sage); font-style: normal; }
  .lp-section-sub { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 540px; margin: 0 auto; }

  /* ── FEATURES ── */
  .lp-features {
    padding: 100px 48px; max-width: 1200px; margin: 0 auto;
  }
  .lp-feat-layout { display: flex; flex-direction: column; gap: 16px; }
  .lp-feat-tabs {
    display: flex; gap: 8px; flex-wrap: wrap;
    background: var(--bg2); border: 1px solid var(--bd); border-radius: 12px; padding: 8px;
  }
  .lp-feat-tab {
    flex: 1; min-width: 140px;
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; background: none; border: 1px solid transparent;
    border-radius: 8px; cursor: pointer; font-family: var(--sans);
    font-size: 13px; font-weight: 500; color: var(--muted);
    transition: all 0.18s; position: relative;
    text-align: left;
  }
  .lp-feat-tab:hover { color: var(--text); background: rgba(255,255,255,0.04); }
  .lp-feat-tab--active { color: var(--text); background: var(--bg3); }
  .lp-feat-tab-icon {
    width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
    font-size: 15px; border-radius: 7px; background: var(--bg3); flex-shrink: 0;
    transition: background 0.2s;
  }
  .lp-feat-tab-bar {
    position: absolute; bottom: 0; left: 8px; right: 8px; height: 2px; border-radius: 1px;
  }

  /* Feature panel */
  .lp-feat-panel {
    display: grid; grid-template-columns: 1fr 1.4fr;
    gap: 40px; background: var(--bg2); border: 1px solid var(--bd);
    border-radius: 16px; padding: 40px; align-items: center;
    transition: border-color 0.3s;
    animation: lp-fade-up 0.4s both;
  }
  .lp-feat-panel-icon {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 16px;
  }
  .lp-feat-panel-title {
    font-size: 22px; font-weight: 700; color: var(--text);
    margin-bottom: 12px; letter-spacing: -0.2px;
  }
  .lp-feat-panel-body { font-size: 14px; color: var(--muted); line-height: 1.7; margin-bottom: 20px; }
  .lp-feat-panel-bullets { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .lp-feat-panel-bullets li {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: var(--muted);
  }
  .lp-feat-bullet-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .lp-feat-preview {
    background: var(--bg3); border: 1px solid var(--bd2);
    border-radius: 12px; padding: 20px; min-height: 240px;
    transition: border-color 0.3s;
  }

  /* Preview components */
  .lp-prev-bookings { display: flex; flex-direction: column; gap: 8px; }
  .lp-prev-bk-row {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; padding: 10px 12px;
  }
  .lp-prev-bk-left { display: flex; flex-direction: column; gap: 3px; }
  .lp-prev-bk-guest { font-size: 13px; font-weight: 600; color: var(--text); }
  .lp-prev-bk-meta { font-size: 10px; color: var(--muted); }
  .lp-prev-bk-right { display: flex; align-items: center; gap: 10px; }
  .lp-prev-bk-amt { font-size: 13px; font-weight: 600; color: var(--sage); font-family: var(--mono); }
  .lp-prev-bk-status {
    font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .lp-prev-bk-paid    { background: rgba(129,178,154,0.15); color: var(--sage); }
  .lp-prev-bk-partial { background: rgba(242,204,143,0.15); color: var(--amber); }
  .lp-prev-bk-total {
    display: flex; justify-content: space-between; font-size: 12px; color: var(--muted);
    padding-top: 8px; border-top: 1px solid var(--bd);
  }
  .lp-prev-bk-total-val { color: var(--sage); font-weight: 700; font-family: var(--mono); }

  /* Calendar preview */
  .lp-prev-cal { display: flex; flex-direction: column; gap: 8px; }
  .lp-prev-cal-nav { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); }
  .lp-prev-cal-month { font-weight: 700; color: var(--text); }
  .lp-prev-cal-dow { display: grid; grid-template-columns: repeat(7,1fr); }
  .lp-prev-cal-dow-item { text-align: center; font-size: 9px; color: var(--faint); font-weight: 700; text-transform: uppercase; padding: 4px 0; }
  .lp-prev-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
  .lp-prev-day {
    height: 28px; display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--muted); border-radius: 4px; position: relative;
  }
  .lp-prev-day-bk::before {
    content: ""; position: absolute; inset: 3px 0;
    background: var(--dc, #81b29a); opacity: 0.22; z-index: 0; border-radius: 0;
  }
  .lp-prev-day-ci::before { border-radius: 50% 0 0 50%; left: 4px; }
  .lp-prev-day-co::before { border-radius: 0 50% 50% 0; right: 4px; }
  .lp-prev-day-bk { color: var(--text); position: relative; z-index: 1; }

  /* Expense preview */
  .lp-prev-expenses { display: flex; flex-direction: column; gap: 10px; }
  .lp-prev-exp-nav { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); }
  .lp-prev-exp-month { font-weight: 700; color: var(--text); }
  .lp-prev-exp-stats { display: flex; gap: 12px; }
  .lp-prev-exp-stat { display: flex; flex-direction: column; gap: 2px; background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; padding: 8px 12px; flex: 1; }
  .lp-prev-exp-stat-val { font-size: 14px; font-weight: 700; color: var(--text); font-family: var(--mono); }
  .lp-prev-exp-stat-label { font-size: 10px; color: var(--muted); }
  .lp-prev-exp-row { display: flex; flex-direction: column; gap: 4px; }
  .lp-prev-exp-row-top { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }
  .lp-prev-exp-amt { color: var(--coral); font-weight: 600; font-family: var(--mono); }
  .lp-prev-exp-bar { height: 4px; background: var(--bd); border-radius: 2px; }
  .lp-prev-exp-fill { height: 100%; background: var(--amber); border-radius: 2px; }

  /* P&L preview */
  .lp-prev-pnl { display: flex; flex-direction: column; gap: 6px; }
  .lp-prev-pnl-card { background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; overflow: hidden; }
  .lp-prev-pnl-open { border-color: rgba(129,178,154,0.3); }
  .lp-prev-pnl-head {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    font-size: 12px; flex-wrap: wrap;
  }
  .lp-prev-pnl-month { font-weight: 700; color: var(--text); flex: 1; }
  .lp-prev-pnl-bk { color: var(--faint); font-size: 11px; }
  .lp-prev-pnl-profit { color: var(--sage); font-weight: 700; font-family: var(--mono); font-size: 13px; }
  .lp-prev-pnl-body { padding: 8px 14px 12px; border-top: 1px solid var(--bd); display: flex; flex-direction: column; gap: 5px; }
  .lp-prev-pnl-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }
  .lp-prev-pnl-total { font-weight: 700; color: var(--text); border-top: 1px solid var(--bd); padding-top: 5px; margin-top: 2px; }
  .lp-green { color: var(--sage) !important; font-family: var(--mono); }
  .lp-red   { color: var(--coral) !important; font-family: var(--mono); }

  /* ── VIDEO SECTION ── */
  .lp-video-section {
    padding: 100px 48px; background: var(--bg2);
    border-top: 1px solid var(--bd); border-bottom: 1px solid var(--bd);
  }
  .lp-video-inner {
    max-width: 900px; margin: 0 auto; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 0;
  }
  .lp-video-frame {
    width: 100%; margin: 40px 0 32px;
    border-radius: 20px; overflow: hidden;
    border: 1px solid var(--bd2);
    box-shadow: 0 32px 80px rgba(0,0,0,0.6);
    background: var(--bg3);
    position: relative;
  }
  .lp-video-thumb {
    position: relative; width: 100%; aspect-ratio: 16/9;
    cursor: pointer; overflow: hidden;
  }
  .lp-video-thumb-bg {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #0e1020 0%, #111520 100%);
    display: flex; flex-direction: column;
  }
  .lp-vthumb-header {
    background: #06080e; padding: 8px 14px;
    display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--bd);
  }
  .lp-vthumb-dots { display: flex; gap: 4px; }
  .lp-vthumb-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--faint); display: block; }
  .lp-vthumb-url { font-family: var(--mono); font-size: 10px; color: var(--faint); }
  .lp-vthumb-body { display: flex; flex: 1; }
  .lp-vthumb-sidebar {
    width: 100px; background: #07090d; border-right: 1px solid var(--bd);
    padding: 12px 8px; display: flex; flex-direction: column; gap: 4px;
  }
  .lp-vthumb-brand { font-size: 8px; font-weight: 700; color: var(--text); opacity: 0.6; padding-bottom: 8px; border-bottom: 1px solid var(--bd); margin-bottom: 4px; }
  .lp-vthumb-prop { font-size: 8px; color: var(--muted); padding: 4px 6px; border-radius: 4px; }
  .lp-vthumb-prop-active { background: rgba(129,178,154,0.12); color: var(--sage); }
  .lp-vthumb-main { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .lp-vthumb-kpis { display: flex; gap: 6px; }
  .lp-vthumb-tab { flex: 1; background: var(--bd); border-radius: 4px; padding: 6px 8px; font-size: 8px; color: var(--muted); text-align: center; }
  .lp-vthumb-months { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .lp-vthumb-month-row { display: flex; align-items: center; gap: 8px; }
  .lp-vthumb-month-name { font-size: 8px; color: var(--muted); width: 24px; flex-shrink: 0; }
  .lp-vthumb-month-bar-wrap { flex: 1; height: 6px; background: var(--bd); border-radius: 3px; overflow: hidden; }
  .lp-vthumb-month-bar { height: 100%; border-radius: 3px; background: var(--sage); opacity: 0.6; }
  .lp-vthumb-month-pnl { font-size: 9px; font-weight: 700; width: 40px; text-align: right; }
  /* Play button */
  .lp-play-btn {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.5); border: none; cursor: pointer;
    transition: background 0.2s;
  }
  .lp-play-btn:hover { background: rgba(0,0,0,0.35); }
  .lp-play-btn:hover .lp-play-ring { transform: scale(1.08); }
  .lp-play-ring {
    position: absolute;
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(129,178,154,0.9); backdrop-filter: blur(4px);
    transition: transform 0.2s;
    box-shadow: 0 8px 32px rgba(129,178,154,0.4);
  }
  .lp-play-btn svg { position: relative; z-index: 1; margin-left: 4px; }
  .lp-video-label {
    position: absolute; bottom: 16px; left: 16px;
    display: flex; align-items: center; gap: 7px;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
    border: 1px solid var(--bd2); border-radius: 6px; padding: 5px 12px;
    font-size: 11px; color: var(--muted);
  }
  .lp-video-label-dot { width: 6px; height: 6px; border-radius: 50%; background: #e07a5f; animation: pulse 1.5s ease-in-out infinite; }
  .lp-video-iframe { width: 100%; aspect-ratio: 16/9; border: none; display: block; }
  .lp-video-points {
    display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;
    font-size: 13px; color: var(--muted);
  }
  .lp-video-point { display: flex; align-items: center; gap: 8px; }
  .lp-video-point-icon { font-size: 14px; }

  /* ── MONTHLY P&L SECTION ── */
  .lp-pnl-section {
    padding: 100px 48px; max-width: 1200px; margin: 0 auto;
  }
  .lp-pnl-inner {
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start;
  }
  .lp-pnl-sub { font-size: 14px; color: var(--muted); line-height: 1.75; margin-bottom: 28px; }
  .lp-pnl-bullets { display: flex; flex-direction: column; gap: 12px; }
  .lp-pnl-bullet { display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: var(--muted); }
  .lp-pnl-bullet-check {
    width: 20px; height: 20px; border-radius: 50%; background: rgba(129,178,154,0.15);
    color: var(--sage); font-size: 11px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
  .lp-months-demo {
    background: var(--bg2); border: 1px solid var(--bd2); border-radius: 16px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.4);
  }
  .lp-months-header {
    padding: 14px 20px; background: var(--bg3); border-bottom: 1px solid var(--bd);
    font-size: 12px; font-weight: 700; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.9px;
  }
  .lp-month-card {
    border-bottom: 1px solid var(--bd); cursor: pointer;
    transition: background 0.15s, border-color 0.2s;
    border-left: 3px solid transparent;
  }
  .lp-month-card:hover { background: rgba(255,255,255,0.02); }
  .lp-month-card-open { background: rgba(129,178,154,0.04); border-left-color: var(--sage); }
  .lp-month-head {
    display: flex; align-items: center; gap: 10px; padding: 14px 20px; flex-wrap: wrap;
  }
  .lp-month-head-left { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }
  .lp-month-name { font-size: 14px; font-weight: 700; color: var(--text); }
  .lp-month-badge {
    font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
    background: rgba(129,178,154,0.15); color: var(--sage); letter-spacing: 0.5px;
  }
  .lp-month-bk { font-size: 11px; color: var(--faint); }
  .lp-month-head-right { display: flex; align-items: center; gap: 8px; font-size: 13px; flex-shrink: 0; }
  .lp-month-rev  { color: var(--sage); font-family: var(--mono); font-weight: 600; }
  .lp-month-cost { color: var(--coral); font-family: var(--mono); font-weight: 600; }
  .lp-month-profit { font-weight: 800; font-family: var(--mono); font-size: 14px; }
  .lp-month-dash { color: var(--faint); }
  .lp-month-chevron { font-size: 9px; color: var(--faint); }
  .lp-month-body { padding: 0 20px 14px; border-top: 1px solid var(--bd); display: flex; flex-direction: column; gap: 6px; margin-top: 0; }
  .lp-month-detail-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); padding-top: 6px; }
  .lp-month-detail-total { font-weight: 700; color: var(--text); border-top: 1px solid var(--bd); padding-top: 8px; }
  .lp-month-green { color: var(--sage); font-family: var(--mono); }
  .lp-month-red   { color: var(--coral); font-family: var(--mono); }
  .lp-months-footer {
    display: flex; justify-content: space-between; padding: 12px 20px;
    font-size: 11px; color: var(--faint); background: var(--bg3);
  }
  .lp-months-profit { color: var(--sage); font-weight: 600; }

  /* ── HOW IT WORKS ── */
  .lp-how { padding: 100px 48px; background: var(--bg2); border-top: 1px solid var(--bd); border-bottom: 1px solid var(--bd); }
  .lp-how-inner { max-width: 1160px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; }
  .lp-steps {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
    position: relative; width: 100%; margin-top: 60px;
  }
  .lp-step { padding: 0 24px 0 0; position: relative; text-align: left; }
  .lp-step-num {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--sage), #4a7a62);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 14px; font-weight: 700; color: #0b0c10;
    margin-bottom: 16px; position: relative; z-index: 1;
    box-shadow: 0 0 0 6px rgba(129,178,154,0.12);
  }
  .lp-step-line {
    position: absolute; top: 20px; left: 40px; right: 24px; height: 1px;
    background: repeating-linear-gradient(90deg, var(--bd2) 0, var(--bd2) 5px, transparent 5px, transparent 12px);
    z-index: 0;
  }
  .lp-step-icon { font-size: 24px; margin-bottom: 12px; }
  .lp-step-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .lp-step-body { font-size: 13px; color: var(--muted); line-height: 1.65; }

  /* ── iCal SECTION ── */
  .lp-ical-section { padding: 100px 48px; max-width: 1200px; margin: 0 auto; }
  .lp-ical-inner {
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
  }
  .lp-ical-body { font-size: 14px; color: var(--muted); line-height: 1.75; margin-bottom: 28px; }
  .lp-ical-platforms { display: flex; flex-wrap: wrap; gap: 8px; }
  .lp-ical-platform {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 6px; border: 1px solid;
    font-size: 12px; font-weight: 600;
  }
  .lp-ical-platform-dot { width: 6px; height: 6px; border-radius: 50%; }
  .lp-ical-card {
    background: var(--bg2); border: 1px solid var(--bd2); border-radius: 16px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.4);
  }
  .lp-ical-card-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 20px; background: var(--bg3); border-bottom: 1px solid var(--bd);
    font-size: 13px; font-weight: 700; color: var(--text);
  }
  .lp-ical-card-tag {
    font-size: 10px; font-weight: 600; color: var(--sage);
    background: rgba(129,178,154,0.12); border: 1px solid rgba(129,178,154,0.2);
    padding: 3px 9px; border-radius: 4px;
  }
  .lp-ical-src {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 20px; border-bottom: 1px solid var(--bd);
    transition: background 0.15s;
  }
  .lp-ical-src:last-of-type { border-bottom: none; }
  .lp-ical-src:hover { background: rgba(255,255,255,0.02); }
  .lp-ical-src-left { display: flex; align-items: center; gap: 12px; }
  .lp-ical-src-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .lp-ical-src-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
  .lp-ical-src-url { font-size: 10px; color: var(--faint); font-family: var(--mono); }
  .lp-ical-src-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
  .lp-ical-src-count { font-size: 11px; color: var(--muted); }
  .lp-ical-src-status { font-size: 11px; color: var(--sage); font-weight: 600; }
  .lp-ical-result {
    padding: 12px 20px; background: rgba(129,178,154,0.06); border-top: 1px solid rgba(129,178,154,0.2);
    font-size: 12px; color: var(--sage); font-weight: 600;
  }

  /* ── FINAL CTA ── */
  .lp-finale {
    padding: 140px 48px; text-align: center;
    position: relative; overflow: hidden;
  }
  .lp-finale-blob {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(129,178,154,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-finale-inner { position: relative; z-index: 1; }
  .lp-finale-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
    color: var(--sage); border: 1px solid rgba(129,178,154,0.25);
    padding: 6px 16px; border-radius: 20px; margin-bottom: 32px;
    background: rgba(129,178,154,0.06);
  }
  .lp-finale-headline {
    font-family: var(--serif); font-size: clamp(38px, 5vw, 64px);
    line-height: 1.06; color: var(--text); margin-bottom: 20px; letter-spacing: -0.5px;
  }
  .lp-finale-headline em { color: var(--sage); font-style: normal; }
  .lp-finale-sub { font-size: 16px; color: var(--muted); margin-bottom: 44px; }
  .lp-finale-note { font-size: 13px; color: var(--faint); margin-top: 20px; }

  /* ── MARKETING EMAIL CAPTURE ── */
  .lp-mc-section {
    border-top: 1px solid var(--bd);
    padding: 60px 48px;
    background: var(--surface);
  }
  .lp-mc-inner {
    max-width: 1160px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    gap: 40px; flex-wrap: wrap;
  }
  .lp-mc-eyebrow {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--sage); margin: 0 0 8px;
  }
  .lp-mc-heading {
    font-size: 22px; font-weight: 700; color: var(--text);
    margin: 0 0 6px; letter-spacing: -0.02em;
  }
  .lp-mc-sub { font-size: 13px; color: var(--faint); margin: 0; }
  .lp-mc-form {
    display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start;
    flex-shrink: 0;
  }
  .lp-mc-input {
    padding: 12px 16px; width: 260px;
    background: var(--bg); border: 1.5px solid var(--bd);
    border-radius: 10px; color: var(--text); font-size: 14px;
    font-family: inherit; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .lp-mc-input:focus { border-color: var(--sage); box-shadow: 0 0 0 3px rgba(129,178,154,0.1); }
  .lp-mc-input::placeholder { color: var(--faint); }
  .lp-mc-input:disabled { opacity: 0.5; }
  .lp-mc-btn {
    padding: 12px 22px; border: none; border-radius: 10px;
    background: var(--sage); color: #0c0e14;
    font-size: 14px; font-weight: 700; font-family: inherit;
    cursor: pointer; white-space: nowrap;
    transition: opacity 0.15s;
  }
  .lp-mc-btn:hover:not(:disabled) { opacity: 0.88; }
  .lp-mc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .lp-mc-success {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 18px; border-radius: 10px;
    background: rgba(129,178,154,0.08); border: 1px solid rgba(129,178,154,0.25);
    color: var(--sage); font-size: 14px; font-weight: 500;
  }
  .lp-mc-error { font-size: 12px; color: #e07a5f; margin: 4px 0 0; width: 100%; }

  /* ── FOOTER ── */
  .lp-footer {
    background: rgba(247,244,236,0.98);
    border-top: 1px solid rgba(61,64,91,0.12);
    padding: 28px 48px;
  }
  .lp-footer-inner {
    max-width: 1160px; margin: 0 auto;
    display: flex; align-items: center; gap: 32px;
  }
  .lp-footer-brand {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 600; color: #111; margin-right: auto;
  }
  .lp-footer-links { display: flex; gap: 24px; }
  .lp-footer-links a { font-size: 12px; color: #888; text-decoration: none; transition: color 0.15s; }
  .lp-footer-links a:hover { color: #333; }
  .lp-footer-copy { font-size: 12px; color: #aaa; }

  /* ── RESPONSIVE ── */
  @media (max-width: 960px) {
    .lp-nav { height: 70px; padding: 0 24px; }
    .lp-nav--stuck { padding: 0 24px; }
    .lp-logo-img { height: 64px; }
    .lp-nav-links { display: none; }
    .lp-nav-cta--desktop { display: none; }
    .lp-nav-menu-btn { display: flex; }
    .lp-nav-cta--drawer { display: inline-flex; }
    .lp-hero { padding: 120px 24px 80px; }
    .lp-hero-inner { grid-template-columns: 1fr; gap: 48px; }
    .lp-hero-right { order: -1; }
    .lp-chip-1, .lp-chip-3 { display: none; }
    .lp-stats-row { grid-template-columns: repeat(2,1fr); padding: 40px 24px; gap: 0; }
    .lp-stat { padding: 20px 24px; border-right: none; border-bottom: 1px solid var(--bd); }
    .lp-stat:nth-child(odd) { border-right: 1px solid var(--bd); }
    .lp-stat:last-child, .lp-stat:nth-last-child(2) { border-bottom: none; }
    .lp-features { padding: 60px 24px; }
    .lp-feat-tabs { flex-direction: column; }
    .lp-feat-panel { grid-template-columns: 1fr; padding: 24px; }
    .lp-video-section { padding: 60px 24px; }
    .lp-pnl-section { padding: 60px 24px; }
    .lp-pnl-inner { grid-template-columns: 1fr; gap: 40px; }
    .lp-how { padding: 60px 24px; }
    .lp-steps { grid-template-columns: 1fr; gap: 32px; margin-top: 40px; }
    .lp-step-line { display: none; }
    .lp-step { padding: 0; }
    .lp-ical-section { padding: 60px 24px; }
    .lp-ical-inner { grid-template-columns: 1fr; gap: 40px; }
    .lp-finale { padding: 80px 24px; }
    .lp-mc-section { padding: 40px 24px; }
    .lp-mc-inner { flex-direction: column; align-items: flex-start; gap: 24px; }
    .lp-mc-input { width: 100%; }
    .lp-mc-form { width: 100%; }
    .lp-mc-btn { width: 100%; text-align: center; padding: 13px; }
    .lp-footer { padding: 24px; }
    .lp-footer-inner { flex-wrap: wrap; gap: 16px; }
    .lp-ticker-item { padding: 14px 20px; }
  }

  @media (max-width: 600px) {
    .lp-hero-actions { flex-direction: column; align-items: flex-start; }
    .lp-month-head { flex-direction: column; align-items: flex-start; gap: 8px; }
    .lp-month-head-right { width: 100%; justify-content: space-between; }
    .lp-feat-panel-left { order: 2; }
    .lp-feat-panel-right { order: 1; }
    .lp-video-points { gap: 12px; }
  }

  .lp-feedback-fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 999;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    background: #1e2130;
    border: 1px solid #2a3050;
    border-radius: 999px;
    color: #81B29A;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    text-decoration: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }
  .lp-feedback-fab:hover {
    background: #151d18;
    border-color: #81B29A;
    transform: translateY(-2px);
  }
  @media (max-width: 600px) {
    .lp-feedback-fab span { display: none; }
    .lp-feedback-fab { padding: 12px 14px; bottom: 20px; right: 20px; font-size: 18px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .blob, .lp-scroll-hint, .lp-chip, .lp-ticker-track,
    .lp-revealed > *, .lp-stat--in, .lp-video-label-dot {
      animation: none !important;
    }
    .lp-nav-cta:hover, .lp-btn-primary:hover, .lp-feedback-fab:hover {
      transform: none;
    }
    .lp-nav-drawer, .lp-nav-backdrop {
      animation: none !important;
    }
    .lp-nav-menu-bar { transition: none; }
  }
`;
