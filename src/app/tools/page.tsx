"use client";

import Link from "next/link";
import { useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────────── */
type Tool = "roi" | "checklist" | "notes";

/* ── Currency config ────────────────────────────────────────────────────── */
const USD_TO_KES = 130;

function fmtCurrency(n: number, currency: "KES" | "USD") {
  const abs = Math.abs(Math.round(n));
  if (currency === "KES") return "KSh " + abs.toLocaleString();
  return "$" + abs.toLocaleString();
}

function pct(n: number) {
  return n.toFixed(1) + "%";
}

/* ── ROI Calculator ─────────────────────────────────────────────────────── */
function ROICalculator() {
  const [currency, setCurrency] = useState<"KES" | "USD">("KES");

  // All monetary state stored in the current display currency
  const [capital, setCapital]       = useState(195000);   // KES default
  const [pricePerStay, setPps]      = useState(10400);    // KES default
  const [occupancy, setOccupancy]   = useState(65);
  const [staysPerMonth, setStays]   = useState(8);
  const [rent, setRent]             = useState(65000);    // KES default
  const [cleaner, setCleaner]       = useState(5200);     // KES default
  const [utilities, setUtilities]   = useState(7800);     // KES default
  const [platformPct, setPlatform]  = useState(3);
  const [mgmtPct, setMgmt]          = useState(10);
  const [supplies, setSupplies]     = useState(2600);     // KES default
  const [hasMgmt, setHasMgmt]       = useState(false);
  const [hasSupplies, setHasSupplies] = useState(false);

  const switchCurrency = (next: "KES" | "USD") => {
    if (next === currency) return;
    const factor = next === "KES" ? USD_TO_KES : 1 / USD_TO_KES;
    setCapital(v => Math.round(v * factor));
    setPps(v => Math.round(v * factor));
    setRent(v => Math.round(v * factor));
    setCleaner(v => Math.round(v * factor));
    setUtilities(v => Math.round(v * factor));
    setSupplies(v => Math.round(v * factor));
    setCurrency(next);
  };

  // Revenue
  const grossMonthly      = pricePerStay * staysPerMonth;
  const grossAnnual       = grossMonthly * 12;

  // Expenses (annual)
  const platformFeeAnnual = grossAnnual * platformPct / 100;
  const mgmtFeeAnnual     = hasMgmt ? grossAnnual * mgmtPct / 100 : 0;
  const cleanerAnnual     = cleaner * 12;
  const utilitiesAnnual   = utilities * 12;
  const rentAnnual        = rent * 12;
  const suppliesAnnual    = hasSupplies ? supplies * 12 : 0;
  const totalExpAnnual    = platformFeeAnnual + mgmtFeeAnnual + cleanerAnnual + utilitiesAnnual + rentAnnual + suppliesAnnual;

  // Results
  const netProfit     = grossAnnual - totalExpAnnual;
  const monthlyProfit = netProfit / 12;
  const roi           = capital > 0 ? (netProfit / capital) * 100 : 0;
  const paybackYears  = netProfit > 0 ? capital / netProfit : null;

  const sym = currency === "KES" ? "KSh" : "$";
  const fmt = (n: number) => fmtCurrency(n, currency);
  const step = (base: number) => currency === "KES" ? base * USD_TO_KES : base;
  const inputCls = "tool-input";
  const fieldCls = "tool-field";

  return (
    <div className="tool-body">
      {/* Currency toggle */}
      <div className="currency-toggle-row">
        <span className="tool-section-label" style={{ margin: 0 }}>Currency</span>
        <div className="currency-toggle">
          {(["KES", "USD"] as const).map(c => (
            <button
              key={c}
              className={`currency-btn ${currency === c ? "currency-btn--active" : ""}`}
              onClick={() => switchCurrency(c)}
            >
              {c === "KES" ? "🇰🇪 KES" : "🇺🇸 USD"}
            </button>
          ))}
        </div>
      </div>

      <div className="roi-sections">
        {/* Initial Capital */}
        <div className="roi-block">
          <p className="tool-section-label">Initial capital investment</p>
          <div className={fieldCls}>
            <label>Total capital invested ({sym})</label>
            <div className="prefix-wrap">
              <span>{sym}</span>
              <input className={inputCls} type="number" value={capital} min={0} step={step(100)}
                onChange={e => setCapital(+e.target.value)} />
            </div>
            <span className="field-hint">Deposit, furnishing, setup — total money put in upfront.</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="roi-block">
          <p className="tool-section-label">Revenue</p>
          <div className="tool-grid-2">
            <div className={fieldCls}>
              <label>Price per stay ({sym})</label>
              <div className="prefix-wrap">
                <span>{sym}</span>
                <input className={inputCls} type="number" value={pricePerStay} min={0} step={step(5)}
                  onChange={e => setPps(+e.target.value)} />
              </div>
            </div>
            <div className={fieldCls}>
              <label>Stays per month</label>
              <input className={inputCls} type="number" value={staysPerMonth} min={0} max={30}
                onChange={e => setStays(+e.target.value)} />
            </div>
            <div className={fieldCls} style={{ gridColumn: "1 / -1" }}>
              <label>Projected occupancy (%)</label>
              <input className={inputCls} type="number" value={occupancy} min={0} max={100}
                onChange={e => setOccupancy(+e.target.value)} />
              <span className="field-hint">
                Gross monthly at current stays: <strong style={{ color: "var(--sage)" }}>{fmt(grossMonthly)}</strong>
                {" · "}Annual: <strong style={{ color: "var(--sage)" }}>{fmt(grossAnnual)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="roi-block">
          <p className="tool-section-label">Monthly expenses</p>
          <div className="tool-grid-2">
            <div className={fieldCls}>
              <label>Rent / month ({sym})</label>
              <div className="prefix-wrap"><span>{sym}</span>
                <input className={inputCls} type="number" value={rent} min={0} step={step(50)}
                  onChange={e => setRent(+e.target.value)} />
              </div>
            </div>
            <div className={fieldCls}>
              <label>Cleaner cost / month ({sym})</label>
              <div className="prefix-wrap"><span>{sym}</span>
                <input className={inputCls} type="number" value={cleaner} min={0} step={step(10)}
                  onChange={e => setCleaner(+e.target.value)} />
              </div>
            </div>
            <div className={fieldCls}>
              <label>Utilities / month ({sym})</label>
              <div className="prefix-wrap"><span>{sym}</span>
                <input className={inputCls} type="number" value={utilities} min={0} step={step(10)}
                  onChange={e => setUtilities(+e.target.value)} />
              </div>
            </div>
            <div className={fieldCls}>
              <label>Platform fees (%)</label>
              <input className={inputCls} type="number" value={platformPct} min={0} max={30} step={0.5}
                onChange={e => setPlatform(+e.target.value)} />
            </div>

            {/* Optional: Management fee */}
            <div className={fieldCls} style={{ gridColumn: "1 / -1" }}>
              <div className="optional-toggle-row">
                <label>Management fee (%)</label>
                <button
                  className={`optional-toggle ${hasMgmt ? "optional-toggle--on" : ""}`}
                  onClick={() => setHasMgmt(!hasMgmt)}
                >
                  {hasMgmt ? "Remove" : "+ Add"}
                </button>
              </div>
              {hasMgmt && (
                <input className={inputCls} type="number" value={mgmtPct} min={0} max={50} step={0.5}
                  onChange={e => setMgmt(+e.target.value)} />
              )}
            </div>

            {/* Optional: Supplies */}
            <div className={fieldCls} style={{ gridColumn: "1 / -1" }}>
              <div className="optional-toggle-row">
                <label>Supplies / month ({sym})</label>
                <button
                  className={`optional-toggle ${hasSupplies ? "optional-toggle--on" : ""}`}
                  onClick={() => setHasSupplies(!hasSupplies)}
                >
                  {hasSupplies ? "Remove" : "+ Add"}
                </button>
              </div>
              {hasSupplies && (
                <div className="prefix-wrap"><span>{sym}</span>
                  <input className={inputCls} type="number" value={supplies} min={0} step={step(10)}
                    onChange={e => setSupplies(+e.target.value)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="roi-results">
        <p className="tool-section-label">Results</p>
        <div className="tool-grid-4">
          {[
            { label: "Annual ROI", val: pct(roi), color: roi >= 0 ? "var(--sage)" : "var(--coral)" },
            { label: "Monthly cash flow", val: (monthlyProfit >= 0 ? "" : "−") + fmt(Math.abs(monthlyProfit)) + "/mo", color: monthlyProfit >= 0 ? "var(--sage)" : "var(--coral)" },
            { label: "Gross annual revenue", val: fmt(grossAnnual), color: "var(--text)" },
            { label: "Total annual expenses", val: fmt(totalExpAnnual), color: "var(--coral)" },
          ].map(m => (
            <div key={m.label} className="metric-card">
              <p className="metric-label">{m.label}</p>
              <p className="metric-value" style={{ color: m.color }}>{m.val}</p>
            </div>
          ))}
        </div>

        <div className="breakdown-card">
          {[
            { label: "Gross annual revenue", val: fmt(grossAnnual), cls: "pos" },
            { label: `Platform fees (${platformPct}%)`, val: "−" + fmt(platformFeeAnnual), cls: "neg" },
            ...(hasMgmt ? [{ label: `Management fees (${mgmtPct}%)`, val: "−" + fmt(mgmtFeeAnnual), cls: "neg" }] : []),
            { label: "Rent", val: "−" + fmt(rentAnnual), cls: "neg" },
            { label: "Cleaning costs", val: "−" + fmt(cleanerAnnual), cls: "neg" },
            { label: "Utilities", val: "−" + fmt(utilitiesAnnual), cls: "neg" },
            ...(hasSupplies ? [{ label: "Supplies", val: "−" + fmt(suppliesAnnual), cls: "neg" }] : []),
          ].map(r => (
            <div key={r.label} className="bd-row">
              <span className="bd-lbl">{r.label}</span>
              <span className={`bd-val ${r.cls}`}>{r.val}</span>
            </div>
          ))}
          <div className="bd-row bd-total">
            <span className="bd-lbl">Net annual profit</span>
            <span className={`bd-val ${netProfit >= 0 ? "pos" : "neg"}`}>
              {(netProfit >= 0 ? "" : "−") + fmt(Math.abs(netProfit)) + "/yr"}
            </span>
          </div>
        </div>

        <div className="payback-wrap">
          <p className="payback-title">Payback period</p>
          <div className="payback-bg">
            <div className="payback-fill" style={{
              width: paybackYears !== null ? Math.min((paybackYears / 20) * 100, 100) + "%" : "100%",
              background: !paybackYears || paybackYears > 10 ? "var(--coral)"
                : paybackYears <= 5 ? "var(--sage)" : "var(--amber)",
            }} />
          </div>
          <p className="payback-label">
            {paybackYears !== null
              ? paybackYears.toFixed(1) + " years to recoup your initial investment"
              : "Not cash-flow positive at these inputs"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Host Checklist ─────────────────────────────────────────────────────── */
const DEFAULT_CHECKLIST = [
  { id: 1, category: "Before listing", text: "Professional photos taken", done: false },
  { id: 2, category: "Before listing", text: "Listing description written and proofread", done: false },
  { id: 3, category: "Before listing", text: "Pricing strategy set (peak/off-peak)", done: false },
  { id: 4, category: "Before listing", text: "House rules documented", done: false },
  { id: 5, category: "Guest check-in", text: "Welcome message sent 24h before arrival", done: false },
  { id: 6, category: "Guest check-in", text: "Check-in instructions shared", done: false },
  { id: 7, category: "Guest check-in", text: "Key/lockbox ready", done: false },
  { id: 8, category: "Guest check-in", text: "Wi-Fi password visible in unit", done: false },
  { id: 9, category: "Between stays", text: "Deep clean completed", done: false },
  { id: 10, category: "Between stays", text: "Linen changed and restocked", done: false },
  { id: 11, category: "Between stays", text: "Consumables restocked (soap, coffee, etc.)", done: false },
  { id: 12, category: "Between stays", text: "Appliances checked", done: false },
  { id: 13, category: "Monthly", text: "P&L reviewed on Tracktar", done: false },
  { id: 14, category: "Monthly", text: "Expenses logged", done: false },
  { id: 15, category: "Monthly", text: "Calendar synced and updated", done: false },
];

function HostChecklist() {
  const [items, setItems] = useState(DEFAULT_CHECKLIST);
  const [newText, setNewText] = useState("");
  const [newCat, setNewCat] = useState("Before listing");

  const categories = [...new Set(items.map(i => i.category))];
  const toggle = (id: number) => setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const remove = (id: number) => setItems(items.filter(i => i.id !== id));
  const add = () => {
    if (!newText.trim()) return;
    setItems([...items, { id: Date.now(), category: newCat, text: newText.trim(), done: false }]);
    setNewText("");
  };
  const doneCount = items.filter(i => i.done).length;

  return (
    <div className="tool-body">
      <div className="checklist-progress">
        <div className="checklist-progress-top">
          <span className="checklist-progress-label">{doneCount} of {items.length} completed</span>
          <span className="checklist-progress-pct">{Math.round((doneCount / items.length) * 100)}%</span>
        </div>
        <div className="progress-bg">
          <div className="progress-fill" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat} className="checklist-group">
          <p className="tool-section-label">{cat}</p>
          {items.filter(i => i.category === cat).map(item => (
            <div key={item.id} className={`checklist-item ${item.done ? "checklist-item--done" : ""}`}>
              <button className="checklist-check" onClick={() => toggle(item.id)}>
                {item.done && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="checklist-text">{item.text}</span>
              <button className="checklist-remove" onClick={() => remove(item.id)}>✕</button>
            </div>
          ))}
        </div>
      ))}

      <div className="checklist-add">
        <p className="tool-section-label">Add item</p>
        <div className="checklist-add-row">
          <select className="tool-input" value={newCat} onChange={e => setNewCat(e.target.value)}
            style={{ maxWidth: 180 }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <input className="tool-input" style={{ flex: 1 }} placeholder="New checklist item…"
            value={newText} onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()} />
          <button className="tool-btn-primary" onClick={add}>Add</button>
        </div>
      </div>
    </div>
  );
}

/* ── Notes / To-do ──────────────────────────────────────────────────────── */
type Note = { id: number; text: string; done: boolean; createdAt: string };

function NotesTodo() {
  const [notes, setNotes]   = useState<Note[]>([
    { id: 1, text: "Follow up with cleaner about new schedule", done: false, createdAt: "Jun 24" },
    { id: 2, text: "Update Airbnb photos for summer season", done: false, createdAt: "Jun 23" },
    { id: 3, text: "Check if insurance covers short-term rentals", done: true, createdAt: "Jun 20" },
  ]);
  const [input, setInput]   = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const add = () => {
    if (!input.trim()) return;
    const now = new Date();
    const createdAt = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setNotes([{ id: Date.now(), text: input.trim(), done: false, createdAt }, ...notes]);
    setInput("");
  };
  const toggle = (id: number) => setNotes(notes.map(n => n.id === id ? { ...n, done: !n.done } : n));
  const remove = (id: number) => setNotes(notes.filter(n => n.id !== id));

  const visible = notes.filter(n =>
    filter === "all" ? true : filter === "done" ? n.done : !n.done
  );

  return (
    <div className="tool-body">
      <div className="notes-input-row">
        <input className="tool-input" style={{ flex: 1 }} placeholder="Add a note or to-do…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()} />
        <button className="tool-btn-primary" onClick={add}>Add</button>
      </div>

      <div className="notes-filter-row">
        {(["all", "active", "done"] as const).map(f => (
          <button key={f} className={`notes-filter-btn ${filter === f ? "notes-filter-btn--active" : ""}`}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="notes-filter-count">
              {f === "all" ? notes.length : f === "done" ? notes.filter(n => n.done).length : notes.filter(n => !n.done).length}
            </span>
          </button>
        ))}
      </div>

      <div className="notes-list">
        {visible.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "32px 0" }}>
            No {filter === "all" ? "" : filter} items yet.
          </p>
        )}
        {visible.map(note => (
          <div key={note.id} className={`note-item ${note.done ? "note-item--done" : ""}`}>
            <button className="checklist-check" onClick={() => toggle(note.id)}>
              {note.done && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="note-text">{note.text}</span>
            <span className="note-date">{note.createdAt}</span>
            <button className="checklist-remove" onClick={() => remove(note.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tools hub ──────────────────────────────────────────────────────────── */
const TOOLS: { id: Tool; icon: string; label: string; description: string; tag: string }[] = [
  { id: "roi",       icon: "📈", label: "ROI Calculator", description: "Estimate returns on a property before you buy.",  tag: "Finance" },
  { id: "checklist", icon: "✅", label: "Host Checklist", description: "Stay on top of every step of the hosting cycle.", tag: "Operations" },
  { id: "notes",     icon: "📝", label: "Notes & To-dos", description: "Quick-capture host notes and action items.",      tag: "Productivity" },
];

export default function ToolsPage() {
  const [active, setActive] = useState<Tool | null>(null);
  const activeTool = TOOLS.find(t => t.id === active);

  return (
    <>
      <style>{CSS}</style>

      <header className="tools-nav-header">
        <div className="tools-nav-inner">
          <Link href="/" className="tools-logo">
            <img src="/logo.png" alt="Tracktar" className="tools-logo-img" />
          </Link>
          <nav className="tools-nav">
            <Link href="/">Home</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/login" className="tools-nav-cta">Get started free →</Link>
          </nav>
        </div>
      </header>

      <div className="tools-header">
        <div className="tools-header-inner">
          {active ? (
            <button className="tools-back-btn" onClick={() => setActive(null)}>
              ← Back to Tools
            </button>
          ) : (
            <Link href="/" className="tools-back-btn">
              ← Back to Home
            </Link>
          )}
          <div>
            <h1 className="tools-title">
              {active ? activeTool?.label : "Host Tools"}
            </h1>
            <p className="tools-subtitle">
              {active
                ? activeTool?.description
                : "Free tools to help you run your short-term rental like a business."}
            </p>
          </div>
        </div>
      </div>

      <div className="tools-page">
        {!active ? (
          <div className="tools-grid">
            {TOOLS.map(tool => (
              <button key={tool.id} className="tool-card" onClick={() => setActive(tool.id)}>
                <div className="tool-card-icon">{tool.icon}</div>
                <div className="tool-card-body">
                  <span className="tool-card-tag">{tool.tag}</span>
                  <h2 className="tool-card-title">{tool.label}</h2>
                  <p className="tool-card-desc">{tool.description}</p>
                </div>
                <span className="tool-card-arrow">→</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="tool-panel">
            {active === "roi"       && <ROICalculator />}
            {active === "checklist" && <HostChecklist />}
            {active === "notes"     && <NotesTodo />}
          </div>
        )}
      </div>

      <footer className="tools-footer">
        <div className="tools-footer-inner">
          <Link href="/" className="tools-footer-brand">
            <img src="/logo.png" alt="Tracktar" className="tools-logo-img" />
          </Link>
          <nav className="tools-footer-links">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <p className="tools-footer-copy">© 2026 Tracktar. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

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
    --sans:  'Geist', system-ui, sans-serif;
    --mono:  'Geist Mono', monospace;
  }

  body { font-family: var(--sans); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
  a { text-decoration: none; color: inherit; }

  /* ── Top nav ── */
  .tools-nav-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(11,12,16,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--bd);
    padding: 0 48px; height: 68px;
    display: flex; align-items: center;
  }
  .tools-nav-inner {
    max-width: 1100px; margin: 0 auto; width: 100%;
    display: flex; align-items: center; justify-content: space-between;
  }
  .tools-logo { display: flex; align-items: center; }
  .tools-logo-img { height: 48px; width: auto; filter: brightness(0.9) saturate(0.8); }
  .tools-nav { display: flex; align-items: center; gap: 28px; }
  .tools-nav a { font-size: 13px; color: var(--muted); transition: color 0.15s; }
  .tools-nav a:hover { color: var(--text); }
  .tools-nav-cta {
    background: var(--sage); color: #0b0c10 !important;
    padding: 8px 16px; border-radius: 8px; font-weight: 500;
    transition: opacity 0.15s;
  }
  .tools-nav-cta:hover { opacity: 0.88; color: #0b0c10 !important; }

  /* ── Page layout ── */
  .tools-header {
    background: var(--bg2);
    border-bottom: 1px solid var(--bd);
    padding: 48px 48px 32px;
  }
  .tools-header-inner { max-width: 1100px; margin: 0 auto; }
  .tools-back-btn {
    background: none; border: none; color: var(--muted);
    font-size: 13px; cursor: pointer; padding: 0; margin-bottom: 12px;
    display: flex; align-items: center; gap: 6px; font-family: var(--sans);
    transition: color 0.15s;
  }
  .tools-back-btn:hover { color: var(--text); }
  .tools-title {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: clamp(28px, 4vw, 42px);
    color: var(--text); margin: 0 0 8px; font-weight: 400;
  }
  .tools-subtitle { font-size: 14px; color: var(--muted); margin: 0; }

  .tools-page {
    max-width: 1100px; margin: 0 auto;
    padding: 40px 48px 80px;
  }

  /* ── Tool grid (vertical list) ── */
  .tools-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 680px;
    margin: 0 auto;
  }
  .tool-card {
    display: flex; align-items: center; gap: 16px;
    background: var(--bg2); border: 1px solid var(--bd);
    border-radius: 14px; padding: 18px 24px;
    cursor: pointer; text-align: left; width: 100%;
    font-family: var(--sans);
    transition: border-color 0.18s, background 0.18s, transform 0.15s;
  }
  .tool-card:hover {
    border-color: var(--bd2);
    background: var(--bg3);
    transform: translateX(4px);
  }
  .tool-card-icon {
    font-size: 28px; width: 52px; height: 52px;
    background: var(--bg3); border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .tool-card-body { flex: 1; }
  .tool-card-tag {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--sage);
    display: block; margin-bottom: 4px;
  }
  .tool-card-title {
    font-size: 15px; font-weight: 600; color: var(--text);
    margin: 0 0 4px;
  }
  .tool-card-desc {
    font-size: 12px; color: var(--muted); line-height: 1.5; margin: 0;
  }
  .tool-card-arrow { font-size: 16px; color: var(--faint); flex-shrink: 0; }

  /* ── Tool panel ── */
  .tool-panel {
    background: var(--bg2); border: 1px solid var(--bd);
    border-radius: 16px; overflow: hidden;
  }
  .tool-body { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }

  /* ── Shared inputs ── */
  .tool-input {
    height: 38px; padding: 0 10px;
    border: 1px solid var(--bd2); border-radius: 8px;
    background: var(--bg3); color: var(--text);
    font-size: 14px; font-family: var(--sans); width: 100%;
    transition: border-color 0.15s;
  }
  .tool-input:focus { outline: none; border-color: var(--sage); }
  .tool-field { display: flex; flex-direction: column; gap: 6px; }
  .tool-field label { font-size: 12px; color: var(--muted); }
  .tool-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .tool-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
  .tool-section-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.09em;
    text-transform: uppercase; color: var(--muted);
    margin: 0 0 10px;
  }
  .prefix-wrap { position: relative; }
  .prefix-wrap > span {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    font-size: 13px; color: var(--muted); pointer-events: none;
  }
  .prefix-wrap .tool-input { padding-left: 36px; }
  .tool-btn-primary {
    padding: 0 20px; height: 38px; border: none; border-radius: 8px;
    background: var(--sage); color: #0b0c10;
    font-size: 13px; font-weight: 600; font-family: var(--sans);
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .tool-btn-primary:hover { opacity: 0.88; }
  .field-hint { font-size: 11px; color: var(--muted); line-height: 1.5; }

  /* ── Currency toggle ── */
  .currency-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg3); border-radius: 10px; padding: 12px 16px;
    border: 1px solid var(--bd);
  }
  .currency-toggle {
    display: flex; gap: 4px;
    background: var(--bg2); border-radius: 8px; padding: 3px;
    border: 1px solid var(--bd);
  }
  .currency-btn {
    padding: 6px 16px; border: none; border-radius: 6px;
    font-size: 12px; font-weight: 600; font-family: var(--sans);
    cursor: pointer; color: var(--muted); background: transparent;
    transition: all 0.15s;
  }
  .currency-btn--active { background: var(--sage); color: #0b0c10; }
  .currency-btn:hover:not(.currency-btn--active) { color: var(--text); }

  /* ── Optional field toggles ── */
  .optional-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
  }
  .optional-toggle {
    padding: 3px 10px; border: 1px solid var(--bd2); border-radius: 6px;
    background: transparent; color: var(--muted); font-size: 11px;
    font-family: var(--sans); cursor: pointer; transition: all 0.15s;
  }
  .optional-toggle--on { border-color: var(--coral); color: var(--coral); }
  .optional-toggle:hover { border-color: var(--text); color: var(--text); }

  /* ── Metric cards ── */
  .metric-card {
    background: var(--bg3); border-radius: 8px; padding: 14px 16px;
  }
  .metric-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
  .metric-value { font-size: 22px; font-weight: 500; color: var(--text); }

  /* ── ROI specific ── */
  .roi-sections { display: flex; flex-direction: column; gap: 20px; }
  .roi-block { padding-bottom: 20px; border-bottom: 1px solid var(--bd); }
  .roi-block:last-child { border-bottom: none; padding-bottom: 0; }
  .roi-results { display: flex; flex-direction: column; gap: 16px; background: var(--bg3); border-radius: 12px; padding: 20px; }
  .breakdown-card { background: var(--bg2); border: 1px solid var(--bd); border-radius: 10px; }
  .bd-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 13px; border-bottom: 1px solid var(--bd); }
  .bd-row:last-child { border-bottom: none; }
  .bd-lbl { color: var(--muted); }
  .bd-val { font-weight: 500; }
  .bd-val.pos { color: var(--sage); }
  .bd-val.neg { color: var(--coral); }
  .bd-total { border-top: 1px solid var(--bd2); }
  .bd-total .bd-lbl { color: var(--text); font-weight: 500; }
  .bd-total .bd-val { font-size: 15px; }
  .payback-wrap { display: flex; flex-direction: column; gap: 6px; }
  .payback-title { font-size: 12px; color: var(--muted); }
  .payback-bg { height: 6px; background: var(--bd); border-radius: 3px; overflow: hidden; }
  .payback-fill { height: 100%; border-radius: 3px; transition: width 0.3s, background 0.3s; }
  .payback-label { font-size: 12px; color: var(--muted); }

  /* ── Checklist specific ── */
  .checklist-progress { display: flex; flex-direction: column; gap: 8px; }
  .checklist-progress-top { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); }
  .checklist-progress-pct { color: var(--sage); font-weight: 600; }
  .progress-bg { height: 4px; background: var(--bd); border-radius: 2px; }
  .progress-fill { height: 100%; background: var(--sage); border-radius: 2px; transition: width 0.3s; }
  .checklist-group { display: flex; flex-direction: column; gap: 6px; }
  .checklist-item {
    display: flex; align-items: center; gap: 10px;
    background: var(--bg3); border: 1px solid var(--bd);
    border-radius: 8px; padding: 10px 12px;
    transition: opacity 0.2s;
  }
  .checklist-item--done { opacity: 0.5; }
  .checklist-item--done .checklist-text { text-decoration: line-through; }
  .checklist-check {
    width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
    border: 1.5px solid var(--bd2); background: var(--bg2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--sage); transition: border-color 0.15s, background 0.15s;
  }
  .checklist-check:hover { border-color: var(--sage); }
  .checklist-item--done .checklist-check { background: rgba(129,178,154,0.15); border-color: var(--sage); }
  .checklist-text { flex: 1; font-size: 13px; color: var(--text); }
  .checklist-remove {
    background: none; border: none; color: var(--faint); cursor: pointer;
    font-size: 11px; padding: 0 4px; transition: color 0.15s;
  }
  .checklist-remove:hover { color: var(--coral); }
  .checklist-add { border-top: 1px solid var(--bd); padding-top: 20px; }
  .checklist-add-row { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Notes specific ── */
  .notes-input-row { display: flex; gap: 8px; }
  .notes-filter-row { display: flex; gap: 6px; }
  .notes-filter-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; background: var(--bg3); border: 1px solid var(--bd);
    border-radius: 6px; color: var(--muted); font-size: 12px; font-family: var(--sans);
    cursor: pointer; transition: all 0.15s;
  }
  .notes-filter-btn--active { border-color: var(--sage); color: var(--sage); background: rgba(129,178,154,0.08); }
  .notes-filter-count {
    background: var(--bd); border-radius: 4px;
    padding: 1px 6px; font-size: 10px; color: var(--muted);
  }
  .notes-list { display: flex; flex-direction: column; gap: 6px; }
  .note-item {
    display: flex; align-items: center; gap: 10px;
    background: var(--bg3); border: 1px solid var(--bd);
    border-radius: 8px; padding: 10px 12px;
    transition: opacity 0.2s;
  }
  .note-item--done { opacity: 0.5; }
  .note-item--done .note-text { text-decoration: line-through; }
  .note-text { flex: 1; font-size: 13px; color: var(--text); }
  .note-date { font-size: 11px; color: var(--faint); flex-shrink: 0; }

  /* ── Footer ── */
  .tools-footer {
    border-top: 1px solid var(--bd);
    background: var(--bg2); padding: 28px 48px;
  }
  .tools-footer-inner {
    max-width: 1100px; margin: 0 auto;
    display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
  }
  .tools-footer-brand { margin-right: auto; }
  .tools-footer-links { display: flex; gap: 24px; }
  .tools-footer-links a { font-size: 12px; color: var(--muted); transition: color 0.15s; }
  .tools-footer-links a:hover { color: var(--text); }
  .tools-footer-copy { font-size: 12px; color: var(--faint); }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .tools-nav-header { padding: 0 20px; }
    .tools-nav a:not(.tools-nav-cta) { display: none; }
    .tools-header { padding: 32px 20px 20px; }
    .tools-page { padding: 24px 16px 60px; }
    .tool-body { padding: 20px 16px; }
    .tool-grid-2 { grid-template-columns: 1fr; }
    .currency-toggle-row { flex-direction: column; align-items: flex-start; gap: 10px; }
    .tools-footer { padding: 24px 20px; }
  }
`;