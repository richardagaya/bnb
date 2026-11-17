"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Arrow, SiteFooter, SiteNav, siteFont } from "@/app/components/SiteChrome";
import "./host-hub.css";

type Tool = "roi" | "checklist" | "notes";
type Currency = "KES" | "USD";

const USD_TO_KES = 130;

function fmtMoney(n: number, currency: Currency) {
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  return currency === "KES" ? `KSh ${abs}` : `$${abs}`;
}

/** Local-only persistence. Tools that use this never render on the server. */
function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

/* ── Shared form bits ──────────────────────────────────────────────────── */

function Field({
  label, value, onChange, prefix, suffix, hint, min = 0, max, step = 1,
}: {
  label: string; value: number; onChange: (n: number) => void;
  prefix?: string; suffix?: string; hint?: string; min?: number; max?: number; step?: number;
}) {
  const id = useId();
  return (
    <div className="hh-field">
      <label htmlFor={id}>{label}</label>
      <div className={`hh-input${prefix ? " has-prefix" : ""}${suffix ? " has-suffix" : ""}`}>
        {prefix && <span className="hh-affix hh-affix--pre">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        {suffix && <span className="hh-affix hh-affix--suf">{suffix}</span>}
      </div>
      {hint && <p className="hh-hint">{hint}</p>}
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`hh-switch${checked ? " is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="hh-switch-track"><span className="hh-switch-thumb" /></span>
      <span className="hh-switch-label">{label}</span>
    </button>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className={`hh-check${checked ? " is-done" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="hh-check-box" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="hh-check-text">{label}</span>
    </label>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="hh-remove" onClick={onClick} aria-label={label}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* ── ROI calculator ────────────────────────────────────────────────────── */

function ROICalculator() {
  const [currency, setCurrency] = useState<Currency>("KES");
  const [capital, setCapital] = useState(195000);
  const [pricePerStay, setPricePerStay] = useState(10400);
  const [stays, setStays] = useState(8);
  const [rent, setRent] = useState(65000);
  const [cleaner, setCleaner] = useState(5200);
  const [utilities, setUtilities] = useState(7800);
  const [platformPct, setPlatformPct] = useState(3);
  const [hasMgmt, setHasMgmt] = useState(false);
  const [mgmtPct, setMgmtPct] = useState(10);
  const [hasSupplies, setHasSupplies] = useState(false);
  const [supplies, setSupplies] = useState(2600);

  const switchCurrency = (next: Currency) => {
    if (next === currency) return;
    const f = next === "KES" ? USD_TO_KES : 1 / USD_TO_KES;
    const conv = (v: number) => Math.round(v * f);
    setCapital(conv); setPricePerStay(conv); setRent(conv);
    setCleaner(conv); setUtilities(conv); setSupplies(conv);
    setCurrency(next);
  };

  const sym = currency === "KES" ? "KSh" : "$";
  const fmt = (n: number) => fmtMoney(n, currency);
  const step = (usd: number) => (currency === "KES" ? usd * USD_TO_KES : usd);

  const grossMonthly = pricePerStay * stays;
  const grossAnnual = grossMonthly * 12;
  const platformAnnual = (grossAnnual * platformPct) / 100;
  const mgmtAnnual = hasMgmt ? (grossAnnual * mgmtPct) / 100 : 0;
  const rentAnnual = rent * 12;
  const cleanerAnnual = cleaner * 12;
  const utilitiesAnnual = utilities * 12;
  const suppliesAnnual = hasSupplies ? supplies * 12 : 0;
  const costsAnnual = platformAnnual + mgmtAnnual + rentAnnual + cleanerAnnual + utilitiesAnnual + suppliesAnnual;
  const netAnnual = grossAnnual - costsAnnual;
  const netMonthly = netAnnual / 12;
  const roi = capital > 0 ? (netAnnual / capital) * 100 : 0;
  const payback = netAnnual > 0 && capital > 0 ? capital / netAnnual : null;
  const margin = grossAnnual > 0 ? (netAnnual / grossAnnual) * 100 : 0;
  const breakEvenStays = pricePerStay > 0
    ? Math.ceil((rent + cleaner + utilities + (hasSupplies ? supplies : 0)) /
        (pricePerStay * (1 - (platformPct + (hasMgmt ? mgmtPct : 0)) / 100)))
    : null;

  const resultsRef = useRef<HTMLElement>(null);
  const [resultsVisible, setResultsVisible] = useState(false);
  useEffect(() => {
    const el = resultsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setResultsVisible(entry.isIntersecting), { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const positive = netAnnual >= 0;
  const tone = payback === null ? "neg" : payback <= 3 ? "good" : payback <= 7 ? "warn" : "neg";
  const verdict =
    payback === null
      ? "At these numbers the property loses money. Try a higher rate or more stays."
      : payback <= 3
        ? "Strong. You'd earn back your setup costs quickly."
        : payback <= 7
          ? "Workable, but slow to pay back. Small changes to rate or rent matter here."
          : "Thin. It will take a long time to earn back what you put in.";

  const rows = [
    { label: `Platform fees (${platformPct}%)`, val: platformAnnual },
    ...(hasMgmt ? [{ label: `Management (${mgmtPct}%)`, val: mgmtAnnual }] : []),
    { label: "Rent", val: rentAnnual },
    { label: "Cleaning", val: cleanerAnnual },
    { label: "Utilities", val: utilitiesAnnual },
    ...(hasSupplies ? [{ label: "Supplies", val: suppliesAnnual }] : []),
  ];

  return (
    <div className="hh-roi">
      <div className="hh-card hh-form">
        <div className="hh-form-head">
          <div>
            <h2>Your numbers</h2>
            <p>Change anything. Results update as you type.</p>
          </div>
          <div className="hh-seg" role="group" aria-label="Currency">
            {(["KES", "USD"] as const).map((c) => (
              <button key={c} type="button" aria-pressed={currency === c} className={currency === c ? "is-active" : undefined} onClick={() => switchCurrency(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="hh-group">
          <legend>Upfront</legend>
          <Field label="Total invested" prefix={sym} value={capital} onChange={setCapital} step={step(100)}
            hint="Deposit, furniture, appliances, setup. Everything you spend before the first guest." />
        </fieldset>

        <fieldset className="hh-group">
          <legend>Revenue</legend>
          <div className="hh-grid-2">
            <Field label="Price per stay" prefix={sym} value={pricePerStay} onChange={setPricePerStay} step={step(5)} />
            <Field label="Stays per month" value={stays} onChange={setStays} max={31} />
          </div>
          <input
            type="range"
            className="hh-range"
            min={0}
            max={31}
            value={stays}
            onChange={(e) => setStays(Number(e.target.value))}
            aria-label="Stays per month"
            style={{ "--p": `${(stays / 31) * 100}%` } as React.CSSProperties}
          />
          <p className="hh-hint">That&apos;s <strong>{fmt(grossMonthly)}</strong> a month before costs.</p>
        </fieldset>

        <fieldset className="hh-group">
          <legend>Monthly costs</legend>
          <div className="hh-grid-2">
            <Field label="Rent" prefix={sym} value={rent} onChange={setRent} step={step(50)} />
            <Field label="Cleaner" prefix={sym} value={cleaner} onChange={setCleaner} step={step(10)} />
            <Field label="Utilities" prefix={sym} value={utilities} onChange={setUtilities} step={step(10)} />
            <Field label="Platform fee" suffix="%" value={platformPct} onChange={setPlatformPct} max={30} step={0.5} />
          </div>
        </fieldset>

        <fieldset className="hh-group">
          <legend>Optional</legend>
          <div className="hh-optional">
            <Switch checked={hasMgmt} onChange={setHasMgmt} label="Co-host or management fee" />
            {hasMgmt && <Field label="Fee" suffix="%" value={mgmtPct} onChange={setMgmtPct} max={50} step={0.5} />}
          </div>
          <div className="hh-optional">
            <Switch checked={hasSupplies} onChange={setHasSupplies} label="Monthly supplies" />
            {hasSupplies && <Field label="Supplies per month" prefix={sym} value={supplies} onChange={setSupplies} step={step(10)} />}
          </div>
        </fieldset>
      </div>

      <a
        href="#hh-results"
        className={`hh-peek${resultsVisible ? " is-hidden" : ""}`}
        aria-hidden={resultsVisible}
        tabIndex={resultsVisible ? -1 : 0}
      >
        <span><small>Annual return</small><b className={positive ? "pos" : "neg"}>{roi.toFixed(1)}%</b></span>
        <span><small>Per month</small><b>{positive ? "" : "−"}{fmt(netMonthly)}</b></span>
        <span className="hh-peek-cta">Breakdown ↓</span>
      </a>

      <aside id="hh-results" ref={resultsRef} className="hh-results" aria-live="polite">
        <div className="hh-card hh-card--dark">
          <p className="hh-res-label">Annual return</p>
          <p className={`hh-res-big${positive ? "" : " is-neg"}`}>{roi.toFixed(1)}%</p>
          <p className="hh-res-verdict">{verdict}</p>

          <div className="hh-res-stats">
            <div>
              <span>Monthly cash flow</span>
              <b className={positive ? "pos" : "neg"}>{positive ? "" : "−"}{fmt(netMonthly)}</b>
            </div>
            <div>
              <span>Profit margin</span>
              <b>{margin.toFixed(0)}%</b>
            </div>
            <div>
              <span>Break-even</span>
              <b>{breakEvenStays !== null && Number.isFinite(breakEvenStays) && breakEvenStays >= 0 ? `${breakEvenStays} stays/mo` : "—"}</b>
            </div>
          </div>

          <div className="hh-payback">
            <div className="hh-payback-top">
              <span>Payback period</span>
              <b>{payback !== null ? `${payback.toFixed(1)} years` : "Never at these numbers"}</b>
            </div>
            <div className="hh-payback-bar">
              <i className={`tone-${tone}`} style={{ width: payback !== null ? `${Math.min((payback / 10) * 100, 100)}%` : "100%" }} />
            </div>
            <div className="hh-payback-scale"><span>0</span><span>5 yrs</span><span>10+ yrs</span></div>
          </div>

          <dl className="hh-breakdown">
            <div><dt>Revenue per year</dt><dd>{fmt(grossAnnual)}</dd></div>
            {rows.map((r) => (
              <div key={r.label}><dt>{r.label}</dt><dd className="neg">−{fmt(r.val)}</dd></div>
            ))}
            <div className="total"><dt>Net profit per year</dt><dd className={positive ? "pos" : "neg"}>{positive ? "" : "−"}{fmt(netAnnual)}</dd></div>
          </dl>
        </div>

        <div className="hh-card hh-upsell">
          <p><strong>Already hosting?</strong> Tracktar tracks the real version of these numbers from your bookings and expenses, month by month.</p>
          <Link href="/login" className="lp-btn lp-btn--primary">Start free <Arrow /></Link>
        </div>
      </aside>
    </div>
  );
}

/* ── Host checklist ────────────────────────────────────────────────────── */

type Item = { id: number; category: string; text: string; done: boolean };

const CATEGORIES = ["Before listing", "Guest check-in", "Between stays", "Monthly"];

const DEFAULT_CHECKLIST: Item[] = [
  { id: 1, category: "Before listing", text: "Professional photos taken", done: false },
  { id: 2, category: "Before listing", text: "Listing description written and proofread", done: false },
  { id: 3, category: "Before listing", text: "Pricing set for peak and off-peak", done: false },
  { id: 4, category: "Before listing", text: "House rules written down", done: false },
  { id: 5, category: "Guest check-in", text: "Welcome message sent 24h before arrival", done: false },
  { id: 6, category: "Guest check-in", text: "Check-in instructions shared", done: false },
  { id: 7, category: "Guest check-in", text: "Keys or lockbox ready", done: false },
  { id: 8, category: "Guest check-in", text: "Wi-Fi password visible in the unit", done: false },
  { id: 9, category: "Between stays", text: "Deep clean done", done: false },
  { id: 10, category: "Between stays", text: "Linen changed", done: false },
  { id: 11, category: "Between stays", text: "Soap, coffee and toilet paper restocked", done: false },
  { id: 12, category: "Between stays", text: "Appliances checked", done: false },
  { id: 13, category: "Monthly", text: "Monthly P&L reviewed in Tracktar", done: false },
  { id: 14, category: "Monthly", text: "Expenses logged", done: false },
  { id: 15, category: "Monthly", text: "Calendars synced and up to date", done: false },
];

function ProgressRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg className="hh-ring" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} className="hh-ring-bg" />
      <circle cx="28" cy="28" r={r} className="hh-ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - value)} />
    </svg>
  );
}

function HostChecklist() {
  const [items, setItems] = useStoredState<Item[]>("tracktar.hub.checklist.v1", DEFAULT_CHECKLIST);
  const [text, setText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const categories = [...new Set([...CATEGORIES, ...items.map((i) => i.category)])];
  const done = items.filter((i) => i.done).length;
  const ratio = items.length ? done / items.length : 0;

  const toggle = (id: number) => setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const remove = (id: number) => setItems(items.filter((i) => i.id !== id));
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setItems([...items, { id: Date.now(), category, text: text.trim(), done: false }]);
    setText("");
  };
  const uncheckAll = () => setItems(items.map((i) => ({ ...i, done: false })));

  return (
    <div className="hh-stack">
      <div className="hh-card hh-progress">
        <ProgressRing value={ratio} />
        <div className="hh-progress-text">
          <b>{done} of {items.length} done</b>
          <span>{ratio === 1 ? "All set. Nice work." : "Saved in this browser, so you can come back to it."}</span>
        </div>
        <button type="button" className="lp-btn lp-btn--quiet hh-btn-sm" onClick={uncheckAll} disabled={done === 0}>
          Uncheck all
        </button>
      </div>

      <div className="hh-check-grid">
        {categories.map((cat) => {
          const list = items.filter((i) => i.category === cat);
          if (list.length === 0) return null;
          const catDone = list.filter((i) => i.done).length;
          return (
            <section key={cat} className="hh-card hh-check-card" aria-label={cat}>
              <header>
                <h3>{cat}</h3>
                <span>{catDone}/{list.length}</span>
              </header>
              <ul>
                {list.map((item) => (
                  <li key={item.id}>
                    <Check checked={item.done} onChange={() => toggle(item.id)} label={item.text} />
                    <RemoveButton onClick={() => remove(item.id)} label={`Remove “${item.text}”`} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <form className="hh-card hh-add" onSubmit={add}>
        <label htmlFor="hh-add-text" className="hh-add-label">Add your own</label>
        <div className="hh-add-row">
          <select aria-label="Section" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input id="hh-add-text" placeholder="e.g. Check the gas cylinder level" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="lp-btn lp-btn--primary hh-btn-sm">Add</button>
        </div>
      </form>
    </div>
  );
}

/* ── Notes & to-dos ────────────────────────────────────────────────────── */

type Note = { id: number; text: string; done: boolean; createdAt: string };
type Filter = "all" | "open" | "done";

function NotesTodo() {
  const [notes, setNotes] = useStoredState<Note[]>("tracktar.hub.notes.v1", []);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const createdAt = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    setNotes([{ id: Date.now(), text: input.trim(), done: false, createdAt }, ...notes]);
    setInput("");
    inputRef.current?.focus();
  };
  const toggle = (id: number) => setNotes(notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
  const remove = (id: number) => setNotes(notes.filter((n) => n.id !== id));
  const clearDone = () => setNotes(notes.filter((n) => !n.done));

  const counts = { all: notes.length, open: notes.filter((n) => !n.done).length, done: notes.filter((n) => n.done).length };
  const visible = notes.filter((n) => (filter === "all" ? true : filter === "done" ? n.done : !n.done));

  return (
    <div className="hh-card hh-notes">
      <form className="hh-notes-input" onSubmit={add}>
        <input
          ref={inputRef}
          aria-label="New note"
          placeholder="Write a note or to-do and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="lp-btn lp-btn--primary hh-btn-sm">Add</button>
      </form>

      <div className="hh-notes-bar">
        <div className="hh-seg" role="group" aria-label="Filter notes">
          {(["all", "open", "done"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} className={filter === f ? "is-active" : undefined} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "open" ? "Open" : "Done"} <span>{counts[f]}</span>
            </button>
          ))}
        </div>
        {counts.done > 0 && (
          <button type="button" className="hh-link" onClick={clearDone}>Clear done</button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="hh-empty">
          {notes.length === 0 ? (
            <>
              <p><b>Nothing here yet.</b></p>
              <p>Things like &ldquo;Ask the cleaner about Saturday&rdquo; or &ldquo;Renew the Wi-Fi bundle&rdquo;. Notes stay in this browser.</p>
            </>
          ) : (
            <p>No {filter} notes.</p>
          )}
        </div>
      ) : (
        <ul className="hh-notes-list">
          {visible.map((n) => (
            <li key={n.id}>
              <Check checked={n.done} onChange={() => toggle(n.id)} label={n.text} />
              <span className="hh-note-date">{n.createdAt}</span>
              <RemoveButton onClick={() => remove(n.id)} label={`Delete “${n.text}”`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

const TOOLS: { id: Tool; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "roi",
    label: "ROI calculator",
    description: "Will this property pay for itself, and how fast?",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="2.5" width="14" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 6h7M6.5 10h1M9.5 10h1M12.5 10h1M6.5 13.5h1M9.5 13.5h1M12.5 13.5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "checklist",
    label: "Host checklist",
    description: "Every step from listing to checkout, ticked off.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3.5 5.5l1.5 1.5 2.5-3M3.5 12.5l1.5 1.5 2.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 6h6M10.5 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "notes",
    label: "Notes & to-dos",
    description: "A scratchpad for the things you'll otherwise forget.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 2.5h7l3.5 3.5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16V4A1.5 1.5 0 0 1 5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 9.5h6M7 12.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const isTool = (v: string): v is Tool => TOOLS.some((t) => t.id === v);

export default function ToolsPage() {
  const [active, setActive] = useState<Tool>("roi");

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (isTool(hash)) setActive(hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const select = (id: Tool) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % TOOLS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + TOOLS.length) % TOOLS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TOOLS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(TOOLS[next].id);
    document.getElementById(`hh-tab-${TOOLS[next].id}`)?.focus();
  };

  return (
    <div className={`lp hh ${siteFont.variable}`}>
      <a href="#main" className="lp-skip">Skip to content</a>
      <SiteNav current="/tools" />

      <main id="main">
        <section className="hh-hero">
          <div className="lp-wrap">
            <p className="lp-kicker">Host hub</p>
            <h1 className="hh-title">Free tools for hosts who like <em>knowing the numbers.</em></h1>
            <p className="lp-lead">
              Run the maths on a new property, keep your turnover routine on track and jot down
              what needs doing. No account needed.
            </p>
          </div>
        </section>

        <section className="hh-body">
          <div className="lp-wrap">
            <div className="hh-tabs" role="tablist" aria-label="Host tools">
              {TOOLS.map((t, i) => (
                <button
                  key={t.id}
                  id={`hh-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active === t.id}
                  aria-controls={`hh-panel-${t.id}`}
                  tabIndex={active === t.id ? 0 : -1}
                  className={`hh-tab${active === t.id ? " is-active" : ""}`}
                  onClick={() => select(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  <span className="hh-tab-icon">{t.icon}</span>
                  <span className="hh-tab-text">
                    <b>{t.label}</b>
                    <small>{t.description}</small>
                  </span>
                </button>
              ))}
            </div>

            <div id={`hh-panel-${active}`} role="tabpanel" aria-labelledby={`hh-tab-${active}`} className="hh-panel">
              {active === "roi" && <ROICalculator />}
              {active === "checklist" && <HostChecklist />}
              {active === "notes" && <NotesTodo />}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
