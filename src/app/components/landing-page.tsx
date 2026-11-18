"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Arrow, SiteFooter, SiteNav, siteFont } from "@/app/components/SiteChrome";

const ksh = (n: number) => `KSh ${n.toLocaleString("en-US")}`;

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [openMonth, setOpenMonth] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("lp--js");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`lp ${siteFont.variable}`}>
      <a href="#main" className="lp-skip">Skip to content</a>

      <SiteNav />

      <main id="main">
        {/* ── Hero ── */}
        <section className="lp-hero">
          <div className="lp-wrap">
            <div className="lp-hero-copy">
              <p className="lp-pill">
                <span className="lp-pill-tag">New</span>
                Monthly summaries now land in your inbox on the 1st
              </p>
              <h1 className="lp-display">
                Your Airbnb is a <em>business.</em>
                <br />
                Run it like one.
              </h1>
              <p className="lp-lead">
                Tracktar keeps your bookings, expenses and calendars in one place, then
                tells you what each property actually earned this month. Made for hosts
                juggling Airbnb, Booking.com and direct guests.
              </p>
              <div className="lp-hero-actions">
                <Link href="/login?mode=signup" className="lp-btn lp-btn--primary">
                  Start tracking for free <Arrow />
                </Link>
                <a href="#demo" className="lp-btn lp-btn--quiet">
                  Watch the 3-minute tour
                </a>
              </div>
              <p className="lp-hero-note">No credit card. Your first property takes about five minutes.</p>
            </div>

            <div className="lp-hero-visual" data-reveal>
              <DashboardMock />
            </div>
          </div>
        </section>

        {/* ── Works with ── */}
        <section className="lp-works" aria-label="Supported booking platforms">
          <div className="lp-wrap lp-works-inner">
            <p>Imports reservations from any iCal calendar, including</p>
            <ul>
              {["Airbnb", "Booking.com", "Vrbo", "Expedia", "Agoda"].map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Statement ── */}
        <section className="lp-statement">
          <div className="lp-wrap">
            <p className="lp-statement-text" data-reveal>
              Most hosts find out how a month went when the rent is due. A payout here,
              a cleaner paid on M-Pesa there, a spreadsheet nobody updated.{" "}
              <span>Tracktar gives you one honest number for every property, every month.</span>
            </p>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="lp-section" id="features">
          <div className="lp-wrap">
            <div className="lp-head" data-reveal>
              <p className="lp-kicker">What&apos;s inside</p>
              <h2 className="lp-h2">Everything a host needs.<br /><em>Nothing they don&apos;t.</em></h2>
              <p className="lp-sub">
                Built around how short-term rentals actually run: one booking, one bill,
                one month at a time.
              </p>
            </div>

            <div className="lp-bento">
              <article className="lp-card lp-card--wide" data-reveal>
                <div className="lp-card-copy">
                  <h3>Bookings, logged in seconds</h3>
                  <p>
                    Guest, dates, source and what they&apos;ve paid. Mark a booking paid,
                    partial or outstanding, and record any discount you gave.
                  </p>
                </div>
                <BookingsMock />
              </article>

              <article className="lp-card" data-reveal>
                <div className="lp-card-copy">
                  <h3>A calendar that blocks itself</h3>
                  <p>Add a booking and its nights are taken. No more double bookings across platforms.</p>
                </div>
                <CalendarMock />
              </article>

              <article className="lp-card" data-reveal>
                <div className="lp-card-copy">
                  <h3>Expenses, filed to the right month</h3>
                  <p>Cleaning, tokens, repairs, toiletries. Grouped by category so you see where it goes.</p>
                </div>
                <ExpensesMock />
              </article>

              <article className="lp-card" data-reveal>
                <div className="lp-card-copy">
                  <h3>Goals that keep you honest</h3>
                  <p>Set a monthly revenue target and watch progress as bookings come in.</p>
                </div>
                <GoalMock />
              </article>

              <article className="lp-card" data-reveal>
                <div className="lp-card-copy">
                  <h3>Co-hosts, without sharing passwords</h3>
                  <p>Invite by email. They handle bookings, calendar and expenses. Your financial setup stays yours.</p>
                </div>
                <CohostMock />
              </article>

              <article className="lp-card lp-card--full lp-card--row" data-reveal>
                <div className="lp-card-copy">
                  <h3>Your month, in your inbox</h3>
                  <p>
                    On the 1st, Tracktar emails a short summary of the month that just
                    closed: revenue, costs and profit for each property.
                  </p>
                </div>
                <EmailMock />
              </article>
            </div>

            <ul className="lp-extras" data-reveal>
              <li><strong>Unlimited properties</strong><span>Switch between listings from one sidebar.</span></li>
              <li><strong>14 currencies</strong><span>KSh, USD, EUR, NGN, ZAR, GBP and more.</span></li>
              <li><strong>Referral tracking</strong><span>Know which agents and friends send you guests.</span></li>
              <li><strong>Free host tools</strong><span>ROI calculator, checklist and notes in the Host hub.</span></li>
            </ul>
          </div>
        </section>

        {/* ── The math ── */}
        <section className="lp-math">
          <div className="lp-wrap lp-math-inner">
            <div className="lp-math-copy" data-reveal>
              <p className="lp-kicker lp-kicker--light">Monthly P&amp;L</p>
              <h2 className="lp-h2">Revenue, minus everything.<br /><em>One number you can trust.</em></h2>
              <p className="lp-sub">
                Every month is saved on its own. Bookings come in, your rent, utilities,
                cleaner and logged expenses go out, and what&apos;s left is your real profit.
              </p>
              <div className="lp-equation" aria-label="Bookings minus fixed costs minus expenses equals net profit">
                <span>Bookings</span><i>−</i><span>Fixed costs</span><i>−</i><span>Expenses</span><i>=</i><b>Net profit</b>
              </div>
            </div>

            <div className="lp-ledger" data-reveal>
              <div className="lp-ledger-head">
                <span>Westlands Loft</span>
                <span>Monthly history</span>
              </div>
              {MONTHS.map((m, i) => {
                const fixed = FIXED.rent + FIXED.utilities + FIXED.cleaner;
                const costs = fixed + m.expenses;
                const profit = m.revenue - costs;
                const open = openMonth === i;
                return (
                  <div key={m.label} className={`lp-ledger-row${open ? " is-open" : ""}`}>
                    <button
                      type="button"
                      className="lp-ledger-toggle"
                      aria-expanded={open}
                      aria-controls={`month-${i}`}
                      onClick={() => setOpenMonth(open ? -1 : i)}
                    >
                      <span className="lp-ledger-month">
                        {m.label}
                        <small>{m.bookings} bookings · {m.nights} nights</small>
                      </span>
                      <span className="lp-ledger-profit">{ksh(profit)}</span>
                      <svg className="lp-ledger-chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {open && (
                      <dl id={`month-${i}`} className="lp-ledger-detail">
                        <div><dt>Revenue from {m.bookings} bookings</dt><dd>{ksh(m.revenue)}</dd></div>
                        <div><dt>Rent</dt><dd className="neg">−{ksh(FIXED.rent)}</dd></div>
                        <div><dt>Utilities</dt><dd className="neg">−{ksh(FIXED.utilities)}</dd></div>
                        <div><dt>Cleaner</dt><dd className="neg">−{ksh(FIXED.cleaner)}</dd></div>
                        <div><dt>Logged expenses{m.note ? ` (${m.note})` : ""}</dt><dd className="neg">−{ksh(m.expenses)}</dd></div>
                        <div className="total"><dt>Net profit</dt><dd>{ksh(profit)}</dd></div>
                        <div className="margin"><dt>Margin</dt><dd>{Math.round((profit / m.revenue) * 100)}%</dd></div>
                      </dl>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── iCal ── */}
        <section className="lp-section">
          <div className="lp-wrap lp-split">
            <div className="lp-split-copy" data-reveal>
              <p className="lp-kicker">Calendar sync</p>
              <h2 className="lp-h2">Paste a link.<br /><em>Your bookings show up.</em></h2>
              <p className="lp-sub">
                Copy the iCal export link from Airbnb, Booking.com or Vrbo and paste it into
                Tracktar. Reservations are pulled in, placed on your calendar and counted in
                that month&apos;s numbers. Duplicates are skipped, and your listings stay
                exactly as they are.
              </p>
            </div>
            <div data-reveal>
              <SyncMock />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="lp-section lp-section--tint" id="how">
          <div className="lp-wrap">
            <div className="lp-head lp-head--left" data-reveal>
              <p className="lp-kicker">How it works</p>
              <h2 className="lp-h2">Set up once.<br /><em>Know every month.</em></h2>
            </div>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li key={s.title} data-reveal>
                  <span className="lp-step-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Demo ── */}
        <section className="lp-section" id="demo">
          <div className="lp-wrap">
            <div className="lp-head" data-reveal>
              <p className="lp-kicker">The tour</p>
              <h2 className="lp-h2">From first property to first report.</h2>
              <p className="lp-sub">
                Three minutes: adding a property, logging a booking, syncing an Airbnb
                calendar and reading the monthly summary.
              </p>
            </div>
            <div className="lp-video" data-reveal>
              {videoPlaying ? (
                <iframe
                  src="https://www.youtube.com/embed/ygcwREFJX5I?autoplay=1&rel=0&modestbranding=1"
                  title="Tracktar product tour"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <button type="button" className="lp-video-poster" onClick={() => setVideoPlaying(true)}>
                  <span className="lp-video-poster-title">A short tour of Tracktar</span>
                  <span className="lp-video-play" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5z" /></svg>
                  </span>
                  <span className="lp-video-meta">Play video · 3 min</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-section lp-section--tint" id="faq">
          <div className="lp-wrap lp-faq">
            <div className="lp-head lp-head--left" data-reveal>
              <p className="lp-kicker">Questions</p>
              <h2 className="lp-h2">Good to know.</h2>
              <p className="lp-sub">
                Something else on your mind? <Link href="/contact">Get in touch</Link> and a
                real person will reply.
              </p>
            </div>
            <div className="lp-faq-list" data-reveal>
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>
                    {f.q}
                    <span className="lp-faq-icon" aria-hidden="true" />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="lp-cta">
          <div className="lp-wrap">
            <div className="lp-cta-card" data-reveal>
              <h2 className="lp-cta-title">Know your numbers.<br /><em>Every month.</em></h2>
              <p>Stop guessing what your property made. Start with one listing today.</p>
              <Link href="/login?mode=signup" className="lp-btn lp-btn--light">
                Create your free account <Arrow />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <a href="https://forms.gle/AtsJdJV4RC4Co6HG6" target="_blank" rel="noopener noreferrer" className="lp-feedback">
        Feedback
      </a>
    </div>
  );
}

/* ── Product mockups (decorative, described via aria-label) ─────────────── */

function DashboardMock() {
  const max = 200000;
  return (
    <div
      className="mk"
      role="img"
      aria-label="The Tracktar dashboard for a property called Westlands Loft, showing October revenue of KSh 184,500, costs of KSh 92,300 and net profit of KSh 92,200."
    >
      <div className="mk-bar">
        <span className="mk-dots"><i /><i /><i /></span>
        <span className="mk-url">tracktar.com/dashboard</span>
      </div>
      <div className="mk-body">
        <aside className="mk-side">
          <p className="mk-side-label">Properties</p>
          <span className="mk-prop is-active"><i style={{ background: "#2F5D50" }} />Westlands Loft</span>
          <span className="mk-prop"><i style={{ background: "#B98A4E" }} />Diani Beach House</span>
          <span className="mk-prop"><i style={{ background: "#6B7A99" }} />Kilimani Studio</span>
          <span className="mk-prop mk-prop--add">+ Add property</span>
        </aside>
        <div className="mk-main">
          <div className="mk-top">
            <div>
              <p className="mk-title">Westlands Loft</p>
              <div className="mk-tabs">
                {["Overview", "Bookings", "Calendar", "Expenses", "Summary"].map((t, i) => (
                  <span key={t} className={i === 0 ? "is-active" : undefined}>{t}</span>
                ))}
              </div>
            </div>
            <span className="mk-month">October 2026</span>
          </div>

          <div className="mk-kpis">
            <div><p>Revenue</p><b>KSh 184,500</b><small>9 bookings</small></div>
            <div><p>Costs</p><b>KSh 92,300</b><small>Fixed + expenses</small></div>
            <div className="is-key"><p>Net profit</p><b>KSh 92,200</b><small className="up">+19.6% vs Sep</small></div>
            <div><p>Occupancy</p><b>74%</b><small>23 of 31 nights</small></div>
          </div>

          <div className="mk-grid">
            <div className="mk-panel">
              <div className="mk-panel-head">
                <span>Last six months</span>
                <span className="mk-legend"><i className="rev" />Revenue <i className="cost" />Costs</span>
              </div>
              <div className="mk-chart">
                {CHART.map((c, i) => (
                  <div key={c.m} className="mk-chart-col">
                    <div className="mk-chart-bars">
                      <span className={`rev${i === CHART.length - 1 ? " is-now" : ""}`} style={{ height: `${(c.rev / max) * 100}%` }} />
                      <span className="cost" style={{ height: `${(c.cost / max) * 100}%` }} />
                    </div>
                    <small>{c.m}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="mk-panel">
              <div className="mk-panel-head"><span>Upcoming check-ins</span></div>
              <ul className="mk-upcoming">
                {UPCOMING.map((u) => (
                  <li key={u.guest}>
                    <span className="mk-avatar">{u.guest.charAt(0)}</span>
                    <span className="mk-up-text"><b>{u.guest}</b><small>{u.dates}</small></span>
                    <span className="mk-src">{u.source}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingsMock() {
  return (
    <div className="mini mini-table" aria-hidden="true">
      <div className="mini-table-head">
        <span>Guest</span><span>Dates</span><span>Source</span><span>Amount</span><span>Status</span>
      </div>
      {BOOKINGS.map((b) => (
        <div key={b.guest} className="mini-table-row">
          <span className="g">{b.guest}</span>
          <span className="d">{b.dates}</span>
          <span className="s">{b.source}</span>
          <span className="a">{ksh(b.amount)}</span>
          <span className={`st st--${b.status}`}>{b.status}</span>
        </div>
      ))}
    </div>
  );
}

function CalendarMock() {
  const ranges = [
    { from: 3, to: 6, tone: "a" },
    { from: 10, to: 14, tone: "b" },
    { from: 19, to: 22, tone: "a" },
    { from: 23, to: 25, tone: "b" },
    { from: 27, to: 30, tone: "c" },
  ];
  const toneFor = (d: number) => ranges.find((r) => d >= r.from && d <= r.to);
  const leading = 6; // November 2026 starts on a Sunday; grid starts Monday
  return (
    <div className="mini mini-cal" aria-hidden="true">
      <div className="mini-cal-head"><span>November 2026</span><span className="mini-cal-arrows">‹ ›</span></div>
      <div className="mini-cal-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="dow">{d}</span>)}
        {Array.from({ length: leading }).map((_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const r = toneFor(d);
          const cls = [
            "day",
            r ? `bk bk--${r.tone}` : "",
            r && d === r.from ? "start" : "",
            r && d === r.to ? "end" : "",
            d === 17 ? "today" : "",
          ].join(" ");
          return <span key={d} className={cls}>{d}</span>;
        })}
      </div>
      <div className="mini-cal-key"><span><i className="a" />Airbnb</span><span><i className="b" />Direct</span><span><i className="c" />Booking.com</span></div>
    </div>
  );
}

function ExpensesMock() {
  const max = Math.max(...EXPENSES.map((e) => e.amount));
  return (
    <div className="mini mini-exp" aria-hidden="true">
      <div className="mini-exp-total"><span>October expenses</span><b>{ksh(28800)}</b></div>
      {EXPENSES.map((e) => (
        <div key={e.cat} className="mini-exp-row">
          <div><span>{e.cat}</span><span>{ksh(e.amount)}</span></div>
          <i><b style={{ width: `${(e.amount / max) * 100}%` }} /></i>
        </div>
      ))}
    </div>
  );
}

function GoalMock() {
  return (
    <div className="mini mini-goal" aria-hidden="true">
      <p className="mini-goal-label">November goal</p>
      <p className="mini-goal-val">{ksh(118400)} <span>of {ksh(200000)}</span></p>
      <div className="mini-goal-bar"><b style={{ width: "59%" }} /></div>
      <div className="mini-goal-foot"><span>59% there</span><span>13 days left</span></div>
    </div>
  );
}

function CohostMock() {
  return (
    <div className="mini mini-cohost" aria-hidden="true">
      <div className="mini-cohost-input"><span>grace@example.com</span><b>Send invite</b></div>
      <div className="mini-cohost-person">
        <span className="mk-avatar">G</span>
        <span><b>Grace Achieng</b><small>Co-host · Westlands Loft</small></span>
      </div>
      <div className="mini-cohost-perms">
        {["Bookings", "Calendar", "Expenses", "Summary"].map((p) => <span key={p}>{p}</span>)}
      </div>
    </div>
  );
}

function EmailMock() {
  return (
    <div className="mini mini-email" aria-hidden="true">
      <div className="mini-email-meta">
        <span className="mk-avatar mk-avatar--brand">T</span>
        <span><b>Tracktar</b><small>Your October 2026 Tracktar summary</small></span>
        <small className="mini-email-time">1 Nov, 07:00</small>
      </div>
      <div className="mini-email-body">
        <p>Westlands Loft made <b>{ksh(92200)}</b> after costs in October, up 19.6% on September.</p>
        <div className="mini-email-stats">
          <span><small>Revenue</small>{ksh(184500)}</span>
          <span><small>Costs</small>{ksh(92300)}</span>
          <span><small>Bookings</small>9</span>
        </div>
      </div>
    </div>
  );
}

function SyncMock() {
  return (
    <div className="mini mini-sync" aria-hidden="true">
      <div className="mini-sync-field">
        <small>iCal link</small>
        <span>https://www.airbnb.com/calendar/ical/48213…ics</span>
      </div>
      <ul>
        <li><span className="src">Airbnb</span><span>4 reservations</span><span className="ok">Synced</span></li>
        <li><span className="src">Booking.com</span><span>2 reservations</span><span className="ok">Synced</span></li>
        <li><span className="src">Direct</span><span>1 reservation</span><span className="ok">Added manually</span></li>
      </ul>
      <p className="mini-sync-foot">7 bookings on your calendar · 0 duplicates</p>
    </div>
  );
}

/* ── Data ───────────────────────────────────────────────────────────────── */

const FIXED = { rent: 45000, utilities: 6500, cleaner: 12000 };

const MONTHS: { label: string; bookings: number; nights: number; revenue: number; expenses: number; note?: string }[] = [
  { label: "October 2026", bookings: 9, nights: 23, revenue: 184500, expenses: 28800 },
  { label: "September 2026", bookings: 8, nights: 20, revenue: 162000, expenses: 21400 },
  { label: "August 2026", bookings: 7, nights: 18, revenue: 141000, expenses: 34200, note: "new water heater" },
];

const CHART = [
  { m: "May", rev: 118000, cost: 81000 },
  { m: "Jun", rev: 131000, cost: 84000 },
  { m: "Jul", rev: 156000, cost: 88000 },
  { m: "Aug", rev: 141000, cost: 97700 },
  { m: "Sep", rev: 162000, cost: 84900 },
  { m: "Oct", rev: 184500, cost: 92300 },
];

const UPCOMING = [
  { guest: "Wanjiru M.", dates: "19 – 22 Nov", source: "Airbnb" },
  { guest: "Daniel O.", dates: "23 – 25 Nov", source: "Direct" },
  { guest: "Priya S.", dates: "27 – 30 Nov", source: "Booking" },
];

const BOOKINGS = [
  { guest: "Wanjiru Mwangi", dates: "19 – 22 Nov", source: "Airbnb", amount: 24600, status: "paid" },
  { guest: "Daniel Otieno", dates: "23 – 25 Nov", source: "Direct", amount: 16000, status: "partial" },
  { guest: "Priya Shah", dates: "27 – 30 Nov", source: "Booking.com", amount: 25200, status: "paid" },
  { guest: "Tom Becker", dates: "2 – 5 Dec", source: "WhatsApp", amount: 24000, status: "unpaid" },
];

const EXPENSES = [
  { cat: "Electricity tokens", amount: 8400 },
  { cat: "Repairs", amount: 7200 },
  { cat: "Cleaning supplies", amount: 6200 },
  { cat: "Internet", amount: 3500 },
  { cat: "Guest amenities", amount: 3500 },
];

const STEPS = [
  {
    title: "Add a property",
    body: "Give it a name and you're in. Add a second, third or tenth whenever you're ready.",
  },
  {
    title: "Enter your running costs",
    body: "Rent, utilities, the cleaner, your nightly rate and platform fees. You only do this once.",
  },
  {
    title: "Log bookings as they happen",
    body: "Type them in, or paste your Airbnb and Booking.com calendar links and let Tracktar import them.",
  },
  {
    title: "Read your month",
    body: "Revenue, costs and net profit per property, saved month by month, with a summary emailed on the 1st.",
  },
];

const FAQ = [
  {
    q: "Is Tracktar free?",
    a: "You can sign up and start tracking for free, with no credit card. Add your property, log bookings and see your monthly numbers straight away.",
  },
  {
    q: "Which booking platforms does it work with?",
    a: "Any platform that gives you an iCal export link, which includes Airbnb, Booking.com and Vrbo. Direct, walk-in and WhatsApp bookings can be added by hand in a few seconds.",
  },
  {
    q: "Will it change anything on my Airbnb listing?",
    a: "No. Tracktar only reads your calendar feed to import reservations. It never edits your listings, prices or availability on any platform.",
  },
  {
    q: "Can I track more than one property?",
    a: "Yes. Each property has its own bookings, expenses, calendar and monthly history, and you can switch between them from the sidebar.",
  },
  {
    q: "Can my co-host or caretaker use it?",
    a: "Invite them by email to a specific property. Co-hosts can work with bookings, the calendar, expenses and the summary, while your financial setup and settings stay with you.",
  },
  {
    q: "What currency does it use?",
    a: "You choose. Tracktar supports 14 currencies including Kenyan Shilling, US Dollar, Euro, British Pound, Nigerian Naira and South African Rand.",
  },
];
