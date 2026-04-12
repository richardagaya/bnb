"use client";

import { useState, useEffect, useRef } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveFeature((n) => (n + 1) % features.length);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{css}</style>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className={scrolled ? "nav nav--stuck" : "nav"}>
        <a href="/" className="nav__logo">
          <span className="nav__logo-mark">H</span>
          HostLedger
        </a>
        <ul className="nav__links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <a href="/login" className="nav__cta">Get started</a>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero" ref={heroRef}>
        <div className="hero__bg-grid" aria-hidden />

        <div className="hero__content">
          <p className="hero__eyebrow">Short-term rental intelligence</p>
          <h1 className="hero__headline">
            Stop guessing.<br />
            Start knowing.
          </h1>
          <p className="hero__sub">
            One dashboard for every property you own. Track what you earn,
            what you spend, and exactly how long until you're profitable.
          </p>
          <div className="hero__actions">
            <a href="/login" className="btn btn--primary">
              Try it free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#how" className="btn btn--ghost">See how it works</a>
          </div>

          <div className="hero__proof">
            <div className="hero__avatars">
              {["#c07a6a","#6a9c80","#c4a45a","#6a7ab8"].map((c, i) => (
                <span key={i} className="hero__avatar" style={{ background: c, zIndex: 4 - i }} />
              ))}
            </div>
            <span>Trusted by 2,400+ hosts in 38 countries</span>
          </div>
        </div>

        <div className="hero__visual">
          <div className="dash">
            <div className="dash__header">
              <div className="dash__dots">
                <span /><span /><span />
              </div>
              <span className="dash__url">hostledger.app/dashboard</span>
            </div>
            <div className="dash__body">
              <aside className="dash__sidebar">
                <p className="dash__brand">⌂ HostLedger</p>
                <button className="dash__prop dash__prop--active">Downtown Loft</button>
                <button className="dash__prop">Beach Villa</button>
                <button className="dash__prop">Studio 4B</button>
                <button className="dash__add">+ Add property</button>
              </aside>
              <div className="dash__main">
                <div className="dash__cards">
                  <div className="dash__card">
                    <span className="dash__card-label">Monthly profit</span>
                    <span className="dash__card-val dash__card-val--green">KSh 2,840</span>
                  </div>
                  <div className="dash__card">
                    <span className="dash__card-label">Annual ROI</span>
                    <span className="dash__card-val dash__card-val--green">14.2%</span>
                  </div>
                  <div className="dash__card">
                    <span className="dash__card-label">Break-even</span>
                    <span className="dash__card-val dash__card-val--amber">284 days</span>
                  </div>
                </div>
                <div className="dash__chart">
                  <p className="dash__chart-label">Expenses this month</p>
                  {[
                    { name: "Cleaning", pct: 78, color: "#81B29A" },
                    { name: "Utilities", pct: 44, color: "#F2CC8F" },
                    { name: "Platform fees", pct: 29, color: "#E07A5F" },
                    { name: "Insurance", pct: 18, color: "#6c7a9c" },
                  ].map((b) => (
                    <div className="dash__bar-row" key={b.name}>
                      <span className="dash__bar-name">{b.name}</span>
                      <div className="dash__bar-track">
                        <div
                          className="dash__bar-fill"
                          style={{ width: `${b.pct}%`, background: b.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* floating annotation cards */}
          <div className="hero__tag hero__tag--1">
            <span className="hero__tag-icon">↑</span>
            ROI up 12% this quarter
          </div>
          <div className="hero__tag hero__tag--2">
            <span className="hero__tag-icon">⚠</span>
            4 vacant days · KSh 560 missed
          </div>
        </div>
      </section>

      {/* ── LOGOS / INTEGRATIONS ─────────────────────────── */}
      <div className="integrations">
        <p className="integrations__label">Syncs with every platform you're listed on</p>
        <div className="integrations__logos">
          {["Airbnb", "Booking.com", "VRBO", "Expedia", "TripAdvisor"].map((name) => (
            <span key={name} className="integrations__logo">{name}</span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="features" id="features">
        <div className="features__header">
          <span className="eyebrow">What it does</span>
          <h2>Built around how<br />hosts actually think</h2>
        </div>

        <div className="features__grid">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`feat ${activeFeature === i ? "feat--active" : ""}`}
              onMouseEnter={() => setActiveFeature(i)}
            >
              <div className="feat__icon" style={{ background: f.iconBg }}>
                {f.icon}
              </div>
              <h3 className="feat__title">{f.title}</h3>
              <p className="feat__body">{f.body}</p>
              <div className="feat__bar">
                <div className="feat__bar-fill" style={{ background: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="how" id="how">
        <div className="how__inner">
          <span className="eyebrow">How it works</span>
          <h2>Zero setup time.<br />Real answers fast.</h2>

          <div className="how__steps">
            {steps.map((s, i) => (
              <div className="step" key={s.title}>
                <div className="step__num">{i + 1}</div>
                <div className="step__content">
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="step__connector" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSED REVENUE CALLOUT ────────────────────────── */}
      <section className="callout">
        <div className="callout__inner">
          <div className="callout__left">
            <span className="callout__tag">Most overlooked feature</span>
            <h2 className="callout__headline">
              You're probably leaving<br />
              <em>KSh 800–KSh 2,000</em> on the table<br />
              every month.
            </h2>
            <p className="callout__body">
              Vacant days are silent killers. HostLedger calculates exactly how much
              revenue you lost to empty nights — so you can adjust your pricing strategy
              before it hurts your quarterly numbers.
            </p>
            <a href="/login" className="btn btn--primary">See your missed revenue</a>
          </div>
          <div className="callout__right">
            <div className="callout__card">
              <p className="callout__card-label">This month's missed income</p>
              <p className="callout__card-num">KSh 1,440</p>
              <p className="callout__card-detail">8 vacant days × KSh 180 avg. nightly rate</p>
              <div className="callout__months">
                {["Jan","Feb","Mar","Apr","May","Jun"].map((m, i) => (
                  <div className="callout__month" key={m}>
                    <div
                      className="callout__month-bar"
                      style={{ height: `${[40,65,30,80,55,70][i]}%` }}
                    />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
              <p className="callout__card-sub">Missed revenue trend</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section className="pricing" id="pricing">
        <div className="pricing__header">
          <span className="eyebrow">Pricing</span>
          <h2>One price. No tricks.</h2>
          <p>Free to start. Upgrade when you need more properties.</p>
        </div>

        <div className="pricing__grid">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`plan ${plan.featured ? "plan--featured" : ""}`}
            >
              {plan.badge && <span className="plan__badge">{plan.badge}</span>}
              <p className="plan__name">{plan.name}</p>
              <div className="plan__price">
                <span className="plan__amount">{plan.price}</span>
                {plan.per && <span className="plan__per">{plan.per}</span>}
              </div>
              <p className="plan__desc">{plan.desc}</p>
              <ul className="plan__features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <span className="plan__check" aria-hidden>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`btn plan__btn ${plan.featured ? "btn--primary" : "btn--outline"}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="pricing__note">No credit card required for free plan. Cancel anytime.</p>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────── */}
      <section className="finale">
        <div className="finale__inner">
          <h2 className="finale__headline">
            Your rental is a business.<br />
            Treat it like one.
          </h2>
          <p className="finale__sub">
            Get clear on your numbers in the next 10 minutes.
          </p>
          <a href="/login" className="btn btn--primary btn--large">
            Create your free account
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="nav__logo-mark">H</span>
            <span>HostLedger</span>
          </div>
          <div className="footer__links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
            <a href="#">Twitter</a>
          </div>
          <p className="footer__copy">© 2026 HostLedger</p>
        </div>
      </footer>
    </>
  );
}

/* ── DATA ─────────────────────────────────────────────────── */

const features = [
  {
    icon: "⟳",
    title: "ROI calculator",
    body: "Put in your capital, nightly rate, and occupancy. Get your exact daily, weekly, and monthly profit — and a countdown to break-even.",
    iconBg: "rgba(129,178,154,0.12)",
    color: "#81B29A",
  },
  {
    icon: "≡",
    title: "Expense tracker",
    body: "Categorize every outgoing — cleaning, utilities, repairs, platform fees. See the full picture, not just what's in your bank account.",
    iconBg: "rgba(242,204,143,0.12)",
    color: "#F2CC8F",
  },
  {
    icon: "◈",
    title: "Calendar sync",
    body: "Paste iCal links from Airbnb, Booking.com, VRBO, and any other platform. All your bookings in one place, automatically.",
    iconBg: "rgba(224,122,95,0.12)",
    color: "#E07A5F",
  },
  {
    icon: "△",
    title: "Missed revenue alerts",
    body: "Vacant days have a dollar value. HostLedger tells you what you lost each month so you can price smarter next time.",
    iconBg: "rgba(108,122,156,0.12)",
    color: "#6c7a9c",
  },
  {
    icon: "⊞",
    title: "Multi-property",
    body: "Own more than one place? Each property gets its own full dashboard. Switch between them in the sidebar — no context-switching mess.",
    iconBg: "rgba(129,178,154,0.12)",
    color: "#81B29A",
  },
  {
    icon: "⌁",
    title: "Actual vs. projected",
    body: "Compare what you planned to earn and spend versus what actually happened. Monthly variance reports in seconds.",
    iconBg: "rgba(242,204,143,0.12)",
    color: "#F2CC8F",
  },
];

const steps = [
  {
    title: "Add your property",
    body: "Name it, pick the type, set a color. Takes about 30 seconds.",
  },
  {
    title: "Fill in your numbers",
    body: "Nightly rate, occupancy estimate, monthly costs, capital invested.",
  },
  {
    title: "Sync your calendars",
    body: "Paste iCal URLs from every platform you're on. Done.",
  },
  {
    title: "Watch the dashboard",
    body: "Your ROI, break-even date, missed revenue, and profit — live.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "KSh 0",
    per: "",
    desc: "1 property. Always free.",
    badge: null,
    featured: false,
    cta: "Start for free",
    features: [
      "1 property",
      "Financial calculator",
      "Expense tracker",
      "2 calendar feeds",
    ],
  },
  {
    name: "Pro",
    price: "KSh 19",
    per: "/mo",
    desc: "For serious hosts.",
    badge: "Most popular",
    featured: true,
    cta: "Start 14-day free trial",
    features: [
      "Unlimited properties",
      "Unlimited calendar feeds",
      "Missed revenue alerts",
      "Variance reports",
      "CSV & PDF export",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    price: "KSh 49",
    per: "/mo",
    desc: "For property managers.",
    badge: null,
    featured: false,
    cta: "Contact us",
    features: [
      "Everything in Pro",
      "Client reports",
      "Team access & roles",
      "White-label branding",
      "Dedicated onboarding",
    ],
  },
];

/* ── STYLES ───────────────────────────────────────────────── */

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0e0f13;
    --bg2:      #141519;
    --bg3:      #1a1b21;
    --border:   rgba(255,255,255,0.07);
    --border2:  rgba(255,255,255,0.12);
    --text:     #e8e6df;
    --muted:    #7a7d8a;
    --faint:    #3a3d4a;
    --sage:     #81B29A;
    --sage-dim: #4a7a62;
    --amber:    #F2CC8F;
    --coral:    #E07A5F;
    --serif:    'Instrument Serif', Georgia, serif;
    --sans:     'Geist', system-ui, sans-serif;
    --mono:     'Geist Mono', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
  }

  /* --- NAV --- */
  .nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 48px;
    transition: background 0.25s, border-color 0.25s, padding 0.25s;
    border-bottom: 1px solid transparent;
  }
  .nav--stuck {
    background: rgba(14,15,19,0.9);
    backdrop-filter: blur(12px);
    border-color: var(--border);
    padding: 14px 48px;
  }
  .nav__logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.2px;
  }
  .nav__logo-mark {
    width: 28px; height: 28px;
    background: var(--sage);
    color: #0e0f13;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 13px;
  }
  .nav__links {
    list-style: none;
    display: flex;
    gap: 32px;
  }
  .nav__links a {
    font-size: 13px;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.15s;
  }
  .nav__links a:hover { color: var(--text); }
  .nav__cta {
    font-size: 13px;
    font-weight: 500;
    color: var(--bg);
    background: var(--text);
    padding: 9px 20px;
    border-radius: 8px;
    text-decoration: none;
    transition: opacity 0.15s;
  }
  .nav__cta:hover { opacity: 0.85; }

  /* --- HERO --- */
  .hero {
    min-height: 100vh;
    padding: 140px 48px 80px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
    max-width: 1160px;
    margin: 0 auto;
    position: relative;
  }
  .hero__bg-grid {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
  }
  .hero__content { position: relative; z-index: 1; }
  .hero__eyebrow {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--sage);
    margin-bottom: 20px;
  }
  .hero__headline {
    font-family: var(--serif);
    font-size: clamp(44px, 5vw, 62px);
    line-height: 1.05;
    color: var(--text);
    margin-bottom: 20px;
    letter-spacing: -0.5px;
  }
  .hero__sub {
    font-size: 15px;
    color: var(--muted);
    line-height: 1.7;
    max-width: 420px;
    margin-bottom: 36px;
  }
  .hero__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }
  .hero__proof {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--muted);
  }
  .hero__avatars {
    display: flex;
  }
  .hero__avatar {
    width: 26px; height: 26px;
    border-radius: 50%;
    border: 2px solid var(--bg);
    margin-left: -7px;
    display: block;
  }
  .hero__avatar:first-child { margin-left: 0; }

  /* --- DASHBOARD MOCKUP --- */
  .hero__visual {
    position: relative;
    z-index: 1;
  }
  .dash {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 14px;
    overflow: hidden;
  }
  .dash__header {
    background: #0a0b0f;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--border);
  }
  .dash__dots {
    display: flex;
    gap: 5px;
  }
  .dash__dots span {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--faint);
    display: block;
  }
  .dash__url {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--faint);
  }
  .dash__body {
    display: flex;
  }
  .dash__sidebar {
    width: 110px;
    background: #0c0d11;
    padding: 14px 10px;
    border-right: 1px solid var(--border);
    flex-shrink: 0;
  }
  .dash__brand {
    font-size: 9px;
    font-weight: 600;
    color: var(--text);
    padding: 0 6px 10px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--border);
    opacity: 0.6;
  }
  .dash__prop {
    display: block;
    width: 100%;
    padding: 6px 8px;
    background: none;
    border: none;
    border-radius: 5px;
    font-family: var(--sans);
    font-size: 9px;
    color: var(--muted);
    text-align: left;
    cursor: default;
    margin-bottom: 2px;
  }
  .dash__prop--active {
    background: rgba(129,178,154,0.1);
    color: var(--sage);
  }
  .dash__add {
    display: block;
    width: 100%;
    padding: 6px 8px;
    background: none;
    border: none;
    font-family: var(--sans);
    font-size: 9px;
    color: var(--faint);
    text-align: left;
    cursor: default;
    margin-top: 8px;
  }
  .dash__main {
    flex: 1;
    padding: 14px;
  }
  .dash__cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  .dash__card {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 10px;
  }
  .dash__card-label {
    display: block;
    font-size: 8px;
    color: var(--faint);
    margin-bottom: 5px;
  }
  .dash__card-val {
    display: block;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--mono);
  }
  .dash__card-val--green { color: var(--sage); }
  .dash__card-val--amber { color: var(--amber); }
  .dash__chart {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 11px;
  }
  .dash__chart-label {
    font-size: 8px;
    color: var(--faint);
    margin-bottom: 10px;
  }
  .dash__bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .dash__bar-name {
    font-size: 8px;
    color: var(--muted);
    width: 60px;
    flex-shrink: 0;
  }
  .dash__bar-track {
    flex: 1;
    height: 4px;
    background: var(--bg2);
    border-radius: 2px;
    overflow: hidden;
  }
  .dash__bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.6s ease;
  }

  /* floating annotation cards */
  .hero__tag {
    position: absolute;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 11px;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    animation: float 3s ease-in-out infinite;
  }
  .hero__tag-icon { font-size: 12px; }
  .hero__tag--1 {
    bottom: -16px; left: -24px;
    color: var(--sage);
    animation-delay: 0s;
  }
  .hero__tag--2 {
    top: -16px; right: -16px;
    color: var(--amber);
    animation-delay: 1.5s;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  /* --- BUTTONS --- */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 22px;
    border-radius: 9px;
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn:active { transform: scale(0.98); }
  .btn--primary {
    background: var(--sage);
    color: #0e0f13;
    border-color: var(--sage);
  }
  .btn--primary:hover { opacity: 0.88; }
  .btn--ghost {
    background: transparent;
    color: var(--muted);
    border-color: var(--border2);
  }
  .btn--ghost:hover { color: var(--text); border-color: var(--border2); }
  .btn--outline {
    background: transparent;
    color: var(--text);
    border-color: var(--border2);
  }
  .btn--outline:hover { border-color: var(--text); }
  .btn--large {
    font-size: 15px;
    padding: 14px 32px;
    border-radius: 11px;
  }

  /* --- INTEGRATIONS --- */
  .integrations {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 28px 48px;
    display: flex;
    align-items: center;
    gap: 40px;
    max-width: 1160px;
    margin: 0 auto;
  }
  .integrations__label {
    font-size: 11px;
    color: var(--faint);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .integrations__logos {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
  }
  .integrations__logo {
    font-size: 12px;
    font-weight: 500;
    color: var(--faint);
    letter-spacing: 0.3px;
    transition: color 0.2s;
  }
  .integrations__logo:hover { color: var(--muted); }

  /* --- EYEBROW --- */
  .eyebrow {
    display: block;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--sage);
    margin-bottom: 14px;
  }

  /* --- FEATURES --- */
  .features {
    padding: 100px 48px;
    max-width: 1160px;
    margin: 0 auto;
  }
  .features__header {
    margin-bottom: 56px;
  }
  .features__header h2 {
    font-family: var(--serif);
    font-size: clamp(32px, 3.5vw, 46px);
    line-height: 1.1;
    color: var(--text);
    letter-spacing: -0.3px;
  }
  .features__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .feat {
    background: var(--bg2);
    padding: 32px;
    position: relative;
    transition: background 0.2s;
    cursor: default;
  }
  .feat--active { background: var(--bg3); }
  .feat__icon {
    width: 36px; height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    margin-bottom: 16px;
    color: var(--text);
  }
  .feat__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 8px;
  }
  .feat__body {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.65;
    margin-bottom: 20px;
  }
  .feat__bar {
    height: 2px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }
  .feat__bar-fill {
    height: 100%;
    width: 0;
    border-radius: 2px;
    transition: width 0.6s ease;
  }
  .feat--active .feat__bar-fill { width: 100%; }

  /* --- HOW IT WORKS --- */
  .how {
    padding: 100px 48px;
    background: var(--bg2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .how__inner {
    max-width: 1160px;
    margin: 0 auto;
  }
  .how h2 {
    font-family: var(--serif);
    font-size: clamp(30px, 3vw, 42px);
    line-height: 1.1;
    color: var(--text);
    margin-bottom: 56px;
    letter-spacing: -0.3px;
  }
  .how__steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    position: relative;
  }
  .step {
    padding-right: 32px;
    position: relative;
  }
  .step__num {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--bg3);
    border: 1px solid var(--border2);
    color: var(--sage);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--mono);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }
  .step__connector {
    position: absolute;
    top: 15px;
    left: calc(32px + 8px);
    right: 0;
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      var(--border2) 0,
      var(--border2) 5px,
      transparent 5px,
      transparent 12px
    );
  }
  .step__content h3 {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 8px;
  }
  .step__content p {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.6;
  }

  /* --- CALLOUT SECTION --- */
  .callout {
    padding: 100px 48px;
    max-width: 1160px;
    margin: 0 auto;
  }
  .callout__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }
  .callout__tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--coral);
    background: rgba(224,122,95,0.1);
    border: 1px solid rgba(224,122,95,0.2);
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 24px;
  }
  .callout__headline {
    font-family: var(--serif);
    font-size: clamp(30px, 3vw, 40px);
    line-height: 1.15;
    color: var(--text);
    margin-bottom: 20px;
    letter-spacing: -0.3px;
  }
  .callout__headline em {
    color: var(--coral);
    font-style: inherit;
  }
  .callout__body {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.7;
    margin-bottom: 32px;
  }
  .callout__card {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 14px;
    padding: 28px;
  }
  .callout__card-label {
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .callout__card-num {
    font-family: var(--mono);
    font-size: 42px;
    font-weight: 400;
    color: var(--coral);
    margin-bottom: 6px;
    letter-spacing: -1px;
  }
  .callout__card-detail {
    font-size: 12px;
    color: var(--faint);
    margin-bottom: 28px;
  }
  .callout__months {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 60px;
    margin-bottom: 8px;
  }
  .callout__month {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    height: 100%;
    justify-content: flex-end;
  }
  .callout__month-bar {
    width: 100%;
    background: rgba(224,122,95,0.3);
    border-radius: 3px 3px 0 0;
    transition: background 0.2s;
  }
  .callout__month:hover .callout__month-bar {
    background: var(--coral);
  }
  .callout__month span {
    font-size: 9px;
    color: var(--faint);
    font-family: var(--mono);
  }
  .callout__card-sub {
    font-size: 10px;
    color: var(--faint);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }

  /* --- PRICING --- */
  .pricing {
    padding: 100px 48px;
    background: var(--bg2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .pricing__header {
    max-width: 1160px;
    margin: 0 auto 56px;
  }
  .pricing__header h2 {
    font-family: var(--serif);
    font-size: clamp(30px, 3vw, 44px);
    color: var(--text);
    letter-spacing: -0.3px;
    margin-bottom: 8px;
  }
  .pricing__header p {
    font-size: 14px;
    color: var(--muted);
  }
  .pricing__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 1160px;
    margin: 0 auto;
  }
  .plan {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 32px;
    position: relative;
    transition: border-color 0.2s;
  }
  .plan:hover { border-color: var(--border2); }
  .plan--featured {
    background: var(--bg);
    border-color: var(--sage-dim);
  }
  .plan__badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    background: var(--sage);
    color: #0e0f13;
    padding: 3px 10px;
    border-radius: 4px;
    margin-bottom: 16px;
  }
  .plan__name {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .plan__price {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 8px;
  }
  .plan__amount {
    font-family: var(--mono);
    font-size: 40px;
    font-weight: 400;
    color: var(--text);
    letter-spacing: -1px;
  }
  .plan__per {
    font-size: 13px;
    color: var(--muted);
  }
  .plan__desc {
    font-size: 12px;
    color: var(--faint);
    margin-bottom: 24px;
  }
  .plan__features {
    list-style: none;
    margin-bottom: 28px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .plan__features li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    color: var(--muted);
  }
  .plan__check {
    color: var(--sage);
    font-size: 11px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .plan__btn { width: 100%; justify-content: center; }
  .pricing__note {
    text-align: center;
    font-size: 12px;
    color: var(--faint);
    margin-top: 24px;
    max-width: 1160px;
    margin-left: auto;
    margin-right: auto;
  }

  /* --- FINALE --- */
  .finale {
    padding: 120px 48px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .finale__inner { position: relative; z-index: 1; }
  .finale__headline {
    font-family: var(--serif);
    font-size: clamp(34px, 4vw, 56px);
    line-height: 1.1;
    color: var(--text);
    margin-bottom: 16px;
    letter-spacing: -0.5px;
  }
  .finale__sub {
    font-size: 15px;
    color: var(--muted);
    margin-bottom: 36px;
  }

  /* --- FOOTER --- */
  .footer {
    border-top: 1px solid var(--border);
    padding: 28px 48px;
  }
  .footer__inner {
    max-width: 1160px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 32px;
  }
  .footer__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin-right: auto;
  }
  .footer__links {
    display: flex;
    gap: 24px;
  }
  .footer__links a {
    font-size: 12px;
    color: var(--faint);
    text-decoration: none;
    transition: color 0.15s;
  }
  .footer__links a:hover { color: var(--muted); }
  .footer__copy {
    font-size: 12px;
    color: var(--faint);
    margin-left: 24px;
  }

  /* --- RESPONSIVE --- */
  @media (max-width: 900px) {
    .nav { padding: 16px 24px; }
    .nav--stuck { padding: 12px 24px; }
    .nav__links { display: none; }
    .hero { grid-template-columns: 1fr; padding: 120px 24px 60px; gap: 40px; }
    .hero__visual { order: -1; }
    .hero__tag--1 { display: none; }
    .hero__tag--2 { display: none; }
    .features { padding: 60px 24px; }
    .features__grid { grid-template-columns: 1fr; gap: 0; }
    .how { padding: 60px 24px; }
    .how__steps { grid-template-columns: 1fr; gap: 32px; }
    .step__connector { display: none; }
    .callout { padding: 60px 24px; }
    .callout__inner { grid-template-columns: 1fr; gap: 40px; }
    .pricing { padding: 60px 24px; }
    .pricing__grid { grid-template-columns: 1fr; }
    .finale { padding: 80px 24px; }
    .footer { padding: 24px; }
    .footer__inner { flex-wrap: wrap; gap: 16px; }
    .integrations { padding: 24px; flex-direction: column; align-items: flex-start; gap: 16px; }
  }
`;
