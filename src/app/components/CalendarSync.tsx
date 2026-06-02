"use client";

import { useState, useRef, useCallback } from "react";
import { useDismissOnEscape, useDismissOnClickOutside } from "@/lib/useDismiss";
import { Booking } from "./BookingTracker";
import type { ImportedBooking } from "../api/ical-sync/route";

export interface CalendarSource {
  id: string;
  platform: string;
  url: string;
  color: string;
  lastSynced: string | null;
  status: "synced" | "error" | "pending";
  lastSyncCount?: number;
  lastSyncError?: string;
}

interface CalendarSyncProps {
  listingId: string;
  sources: CalendarSource[];
  onAddSource: (source: Omit<CalendarSource, "id" | "lastSynced" | "status">) => void;
  onRemoveSource: (id: string) => void;
  onSync: (id: string, updates?: Partial<CalendarSource>) => void;
  onImportBookings?: (bookings: ImportedBooking[]) => { added: number; skipped: number };
  bookings?: Booking[];
}

const PLATFORMS = [
  { name: "Airbnb",       color: "#FF5A5F", abbr: "AB" },
  { name: "Booking.com",  color: "#003580", abbr: "BC" },
  { name: "VRBO",         color: "#1A5276", abbr: "VR" },
  { name: "Expedia",      color: "#FFC72C", abbr: "EX" },
  { name: "TripAdvisor",  color: "#34E0A1", abbr: "TA" },
  { name: "Direct",       color: "#81B29A", abbr: "DR" },
  { name: "Other",        color: "#8B8B8B", abbr: "OT" },
];

const SOURCE_COLORS: Record<string, string> = {
  "Airbnb":           "#FF5A5F",
  "Booking.com":      "#4A7FBF",
  "VRBO":             "#1A8FFF",
  "Agoda":            "#E8000B",
  "Expedia":          "#FFC72C",
  "Direct / Walk-in": "#81B29A",
  "WhatsApp / Phone": "#25D366",
  "Other":            "#8B8B8B",
};

const DAYS        = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type DayType = "checkIn" | "checkOut" | "mid" | "single";
interface DayInfo { color: string; type: DayType; guestName: string; bookingId: string; source: string; }

function buildDayMap(bookings: Booking[]): Record<string, DayInfo> {
  const map: Record<string, DayInfo> = {};
  bookings.forEach((b) => {
    if (b.status === "cancelled") return;
    const color    = SOURCE_COLORS[b.source] || "#8B8B8B";
    const checkIn  = new Date(b.checkIn  + "T00:00:00");
    const checkOut = new Date(b.checkOut + "T00:00:00");
    const sameDay  = b.checkIn === b.checkOut;
    let cur = new Date(checkIn);
    while (cur <= checkOut) {
      const key = cur.toISOString().split("T")[0];
      const t   = cur.getTime();
      let type: DayType = "mid";
      if (sameDay)                     type = "single";
      else if (t === checkIn.getTime())  type = "checkIn";
      else if (t === checkOut.getTime()) type = "checkOut";
      if (!map[key]) map[key] = { color, type, guestName: b.guestName, bookingId: b.id, source: b.source };
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
}

interface SyncResult { added: number; skipped: number; error?: string }

export default function CalendarSync({
  sources,
  onAddSource,
  onRemoveSource,
  onSync,
  onImportBookings,
  bookings = [],
}: CalendarSyncProps) {
  const today = new Date();
  const [viewYear,   setViewYear]   = useState(today.getFullYear());
  const [viewMonth,  setViewMonth]  = useState(today.getMonth());
  const [showForm,   setShowForm]   = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const closeForm = useCallback(() => setShowForm(false), []);
  useDismissOnEscape(showForm, closeForm);
  useDismissOnClickOutside(formRef, showForm, closeForm);

  const [form,       setForm]       = useState({ platform: "Airbnb", url: "" });
  const [syncingId,  setSyncingId]  = useState<string | null>(null);
  const [tooltip,    setTooltip]    = useState<{ key: string; text: string } | null>(null);
  const [syncResult, setSyncResult] = useState<Record<string, SyncResult>>({});

  const dayMap   = buildDayMap(bookings);
  const todayKey = today.toISOString().split("T")[0];

  // Build the grid for the current viewed month
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => viewMonth === 0 ? (setViewYear(y => y - 1), setViewMonth(11)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewYear(y => y + 1), setViewMonth(0)) : setViewMonth(m => m + 1);
  const goToday   = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const isCurrentView = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Bookings that touch the viewed month (for legend)
  const monthPfx = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthBookings = bookings.filter(
    (b) => b.status !== "cancelled" &&
      (b.checkIn.startsWith(monthPfx) || b.checkOut.startsWith(monthPfx) ||
      (b.checkIn < monthPfx + "-01" && b.checkOut > monthPfx + "-31"))
  );

  // Upcoming (from today onwards), sorted
  const upcomingBookings = bookings
    .filter((b) => b.status !== "cancelled" && b.checkIn >= todayKey)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const confirmedCount = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;

  const handleAdd = () => {
    if (!form.url.trim()) return;
    const platformData = PLATFORMS.find((p) => p.name === form.platform);
    onAddSource({ platform: form.platform, url: form.url, color: platformData?.color || "#81B29A" });
    setForm({ platform: "Airbnb", url: "" });
    setShowForm(false);
  };

  const handleSync = async (id: string) => {
    const source = sources.find((s) => s.id === id);
    if (!source) return;
    setSyncingId(id);
    setSyncResult((prev) => { const n = { ...prev }; delete n[id]; return n; });

    try {
      const res  = await fetch("/api/ical-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: source.url, platform: source.platform }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error ?? `HTTP ${res.status}`;
        onSync(id, { status: "error", lastSyncError: errMsg });
        setSyncResult((prev) => ({ ...prev, [id]: { added: 0, skipped: 0, error: errMsg } }));
        return;
      }

      const imported: ImportedBooking[] = data.bookings ?? [];
      let added = 0, skipped = 0;

      if (onImportBookings && imported.length > 0) {
        ({ added, skipped } = onImportBookings(imported));
      } else {
        skipped = imported.length;
      }

      const now = new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
      onSync(id, { status: "synced", lastSynced: now, lastSyncCount: imported.length, lastSyncError: undefined });
      setSyncResult((prev) => ({ ...prev, [id]: { added, skipped } }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      onSync(id, { status: "error", lastSyncError: msg });
      setSyncResult((prev) => ({ ...prev, [id]: { added: 0, skipped: 0, error: msg } }));
    } finally {
      setSyncingId(null);
    }
  };

  const platformMeta = (name: string) => PLATFORMS.find((p) => p.name === name) ?? PLATFORMS[PLATFORMS.length - 1];

  return (
    <div className="cs-root">

      {/* ── Page header ── */}
      <div className="cs-page-header">
        <div>
          <h2 className="cs-title">Availability Calendar</h2>
          <p className="cs-desc">Bookings are blocked automatically. Add iCal feeds to sync external platforms.</p>
        </div>
        <div className="cs-header-kpis">
          <div className="cs-kpi">
            <span className="cs-kpi-val">{confirmedCount}</span>
            <span className="cs-kpi-label">Bookings</span>
          </div>
          <div className="cs-kpi">
            <span className="cs-kpi-val">{upcomingBookings.length}</span>
            <span className="cs-kpi-label">Upcoming</span>
          </div>
        </div>
      </div>

      {/* ── Calendar card ── */}
      <div className="cs-cal-card">

        {/* Month navigation */}
        <div className="cs-cal-nav">
          <button className="cs-nav-arrow" onClick={prevMonth}>‹</button>
          <div className="cs-nav-mid">
            <span className="cs-nav-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            {!isCurrentView && (
              <button className="cs-nav-today-btn" onClick={goToday}>Today</button>
            )}
          </div>
          <button className="cs-nav-arrow" onClick={nextMonth}>›</button>
        </div>

        {/* Day-of-week headers */}
        <div className="cs-dow-row">
          {DAYS.map((d) => <span key={d} className="cs-dow">{d}</span>)}
        </div>

        {/* Day grid */}
        <div className="cs-grid">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e${idx}`} className="cs-cell cs-cell-empty" />;
            const key  = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const info = dayMap[key];
            const isT  = key === todayKey;
            const past = key < todayKey;
            return (
              <div
                key={key}
                className={[
                  "cs-cell",
                  past   ? "cs-past"  : "",
                  isT    ? "cs-today" : "",
                  info   ? `cs-bk cs-bk-${info.type}` : "cs-free",
                ].join(" ")}
                style={info ? { "--c": info.color } as React.CSSProperties : {}}
                onMouseEnter={() => info && setTooltip({ key, text: `${info.guestName} · ${info.source}` })}
                onMouseLeave={() => setTooltip(null)}
              >
                <span className={`cs-day-num ${isT ? "cs-today-num" : ""}`}>{day}</span>
                {tooltip?.key === key && (
                  <div className="cs-tooltip">{tooltip.text}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {monthBookings.length > 0 ? (
          <div className="cs-legend">
            {monthBookings.map((b) => {
              const color = SOURCE_COLORS[b.source] || "#8B8B8B";
              return (
                <div key={b.id} className="cs-legend-row">
                  <span className="cs-legend-pip" style={{ background: color }} />
                  <span className="cs-legend-name">{b.guestName}</span>
                  <span className="cs-legend-info">{b.checkIn} → {b.checkOut} · {b.source}</span>
                  <span className="cs-legend-nights">{b.nights}n</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="cs-avail-bar">
            <span className="cs-avail-pill">Fully Available</span>
            <span>No bookings this month</span>
          </div>
        )}
      </div>

      {/* ── Upcoming check-ins ── */}
      {upcomingBookings.length > 0 && (
        <div className="cs-upcoming-card">
          <h3 className="cs-upcoming-title">Upcoming Check-ins</h3>
          {upcomingBookings.slice(0, 6).map((b) => {
            const color = SOURCE_COLORS[b.source] || "#8B8B8B";
            const ms    = new Date(b.checkIn + "T00:00:00").getTime() - new Date(todayKey + "T00:00:00").getTime();
            const daysAway = Math.round(ms / 86400000);
            return (
              <div key={b.id} className="cs-uc-row">
                <div className="cs-uc-bar" style={{ background: color }} />
                <div className="cs-uc-body">
                  <span className="cs-uc-guest">{b.guestName}</span>
                  <span className="cs-uc-meta">{b.checkIn} → {b.checkOut} · {b.nights}n · {b.source}</span>
                </div>
                <span
                  className="cs-uc-chip"
                  style={{ color, borderColor: `${color}44`, background: `${color}14` }}
                >
                  {daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `In ${daysAway}d`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── iCal Sync ── */}
      <div className="cs-ical-card">
        <div className="cs-ical-top">
          <div>
            <h3 className="cs-ical-title">iCal Sync</h3>
            <p className="cs-ical-sub">Import bookings from Airbnb, Booking.com, VRBO and others via iCal URL.</p>
          </div>
          <button className="cs-btn-add" onClick={() => setShowForm(v => !v)}>
            {showForm ? "Cancel" : "+ Add Feed"}
          </button>
        </div>

        {showForm && (
          <div className="cs-form" ref={formRef}>
            <p className="cs-form-heading">Platform</p>
            <div className="cs-platform-grid">
              {PLATFORMS.map((p) => (
                <button
                  key={p.name}
                  className={`cs-plat-btn ${form.platform === p.name ? "cs-plat-sel" : ""}`}
                  style={form.platform === p.name ? { borderColor: p.color, background: `${p.color}18`, color: p.color } : {}}
                  onClick={() => setForm({ ...form, platform: p.name })}
                >
                  <span className="cs-plat-abbr">{p.abbr}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
            <p className="cs-form-heading" style={{ marginTop: 12 }}>iCal URL</p>
            <input
              className="cs-url-input"
              placeholder="https://www.airbnb.com/calendar/ical/..."
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <p className="cs-form-hint">Find this under Availability → Sync Calendars → Export on your platform.</p>
            <div className="cs-form-btns">
              <button className="cs-btn-add" onClick={handleAdd}>Add Calendar</button>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="cs-sources">
            {sources.map((source) => {
              const meta   = platformMeta(source.platform);
              const result = syncResult[source.id];
              return (
                <div key={source.id} className={`cs-src-row ${source.status === "error" ? "cs-src-err" : ""}`}>
                  <div className="cs-src-badge" style={{ background: `${meta.color}18`, borderColor: `${meta.color}44` }}>
                    <span className="cs-plat-abbr">{meta.abbr}</span>
                    <span style={{ color: meta.color, fontSize: "12px", fontWeight: 600 }}>{source.platform}</span>
                  </div>
                  <div className="cs-src-info">
                    <span className="cs-src-url">{source.url}</span>
                    <div className="cs-src-status">
                      <span className={`cs-status-dot cs-dot-${source.status}`} />
                      <span className="cs-status-lbl">
                        {source.status === "synced" && source.lastSynced
                          ? `Synced ${source.lastSynced}${source.lastSyncCount !== undefined ? ` · ${source.lastSyncCount} booking${source.lastSyncCount !== 1 ? "s" : ""} found` : ""}`
                          : source.status === "error"
                          ? source.lastSyncError ?? "Sync failed"
                          : "Not synced yet"}
                      </span>
                    </div>
                    {/* Inline result banner after sync */}
                    {result && !result.error && (
                      <div className="cs-result-banner">
                        {result.added > 0
                          ? `${result.added} new booking${result.added !== 1 ? "s" : ""} imported`
                          : "Up to date"}
                        {result.skipped > 0 && result.added > 0 && ` · ${result.skipped} already existed`}
                      </div>
                    )}
                    {result?.error && (
                      <div className="cs-error-banner">{result.error}</div>
                    )}
                  </div>
                  <div className="cs-src-acts">
                    <button
                      className={`cs-sync-btn ${syncingId === source.id ? "cs-syncing" : ""}`}
                      onClick={() => handleSync(source.id)}
                      disabled={syncingId === source.id}
                    >
                      {syncingId === source.id ? "⟳ Syncing…" : "⟳ Sync Now"}
                    </button>
                    <button className="cs-rm-btn" onClick={() => onRemoveSource(source.id)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sources.length === 0 && !showForm && (
          <div className="cs-ical-empty">
            <p>No iCal feeds connected. Your bookings are already blocked automatically above.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Root */
        .cs-root { display: flex; flex-direction: column; gap: 20px; min-width: 0; max-width: 100%; overflow-x: hidden; }

        /* Page header */
        .cs-page-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; flex-wrap: wrap;
        }
        .cs-title { font-size: 22px; font-weight: 700; color: #e8e3d9; margin: 0 0 4px; }
        .cs-desc  { font-size: 13px; color: #5a6080; margin: 0; line-height: 1.5; }
        .cs-header-kpis { display: flex; gap: 12px; }
        .cs-kpi {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          background: #161924; border: 1px solid #1e2130; border-radius: 10px; padding: 10px 20px;
        }
        .cs-kpi-val   { font-size: 24px; font-weight: 800; color: #e8e3d9; line-height: 1; }
        .cs-kpi-label { font-size: 10px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.7px; }

        /* Calendar card */
        .cs-cal-card {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 16px;
          overflow: hidden;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Month navigation */
        .cs-cal-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #1e2130;
          background: #111520;
        }
        .cs-nav-arrow {
          width: 36px; height: 36px;
          background: #1e2130; border: 1px solid #2a3050; border-radius: 8px;
          color: #8a9080; font-size: 22px; line-height: 1;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .cs-nav-arrow:hover { background: #2a3050; color: #e8e3d9; }
        .cs-nav-mid { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .cs-nav-label { font-size: 18px; font-weight: 700; color: #e8e3d9; }
        .cs-nav-today-btn {
          background: none; border: none; color: #81b29a; font-size: 11px;
          cursor: pointer; font-family: inherit; padding: 0;
          text-decoration: underline; text-underline-offset: 2px;
        }

        /* Day-of-week row */
        .cs-dow-row {
          display: grid; grid-template-columns: repeat(7, 1fr);
          padding: 12px 16px 4px; background: #111520;
        }
        .cs-dow { text-align: center; font-size: 10px; font-weight: 700; color: #4a5068; text-transform: uppercase; letter-spacing: 0.8px; }

        /* Grid */
        .cs-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          padding: 4px 10px 10px; gap: 2px;
        }

        /* Individual cells */
        .cs-cell {
          position: relative;
          height: 46px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; color: #8a9080;
          cursor: default; user-select: none;
          transition: color 0.1s;
        }
        .cs-cell-empty { pointer-events: none; }
        .cs-free:hover { color: #c8c3b8; }
        .cs-past { opacity: 0.3; }

        /* Today */
        .cs-today-num {
          background: #81b29a !important;
          color: #0f1117 !important;
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }
        .cs-today { color: #e8e3d9; }

        /* Day number span */
        .cs-day-num {
          position: relative; z-index: 1;
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
        }

        /* Booked ranges — background strip */
        .cs-bk::before {
          content: "";
          position: absolute;
          inset: 7px 0;
          background: var(--c, #81b29a);
          opacity: 0.22;
          z-index: 0;
          border-radius: 0;
        }
        .cs-bk { color: #e8e3d9 !important; }
        .cs-bk-checkIn::before  { border-radius: 50% 0 0 50%; left: 10px; }
        .cs-bk-checkOut::before { border-radius: 0 50% 50% 0; right: 10px; }
        .cs-bk-single::before   { border-radius: 50%; left: 8px; right: 8px; opacity: 0.4; }
        .cs-bk-mid::before      { border-radius: 0; }

        /* Check-in day number — filled circle */
        .cs-bk-checkIn .cs-day-num,
        .cs-bk-single .cs-day-num {
          background: var(--c, #81b29a) !important;
          color: #fff !important;
          opacity: 1;
          font-weight: 700;
        }
        /* Check-out day number — softer */
        .cs-bk-checkOut .cs-day-num {
          background: color-mix(in srgb, var(--c) 55%, transparent) !important;
          color: #fff !important;
          font-weight: 600;
        }
        /* Mid-stay day number */
        .cs-bk-mid .cs-day-num {
          background: color-mix(in srgb, var(--c) 30%, transparent) !important;
          color: #fff !important;
        }

        /* Tooltip */
        .cs-tooltip {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%; transform: translateX(-50%);
          background: #1e2130; border: 1px solid #2a3050;
          border-radius: 7px; padding: 6px 10px;
          font-size: 11px; color: #c8c3b8; white-space: nowrap;
          z-index: 20; pointer-events: none;
          box-shadow: 0 6px 16px rgba(0,0,0,0.5);
        }

        /* Legend */
        .cs-legend {
          border-top: 1px solid #1e2130; padding: 12px 18px;
          display: flex; flex-direction: column; gap: 7px;
        }
        .cs-legend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; min-width: 0; overflow: hidden; }
        .cs-legend-pip { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .cs-legend-name { color: #c8c3b8; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
        .cs-legend-info { color: #5a6080; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cs-legend-nights { color: #4a5068; font-size: 11px; flex-shrink: 0; }

        /* Available bar */
        .cs-avail-bar {
          border-top: 1px solid #1e2130; padding: 12px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 12px; color: #4a5068;
        }
        .cs-avail-pill {
          background: #0f1a16; border: 1px solid #81b29a44;
          color: #81b29a; border-radius: 4px;
          padding: 2px 9px; font-size: 11px; font-weight: 600;
        }

        /* Upcoming strip */
        .cs-upcoming-card {
          background: #161924; border: 1px solid #1e2130; border-radius: 14px; overflow: hidden;
        }
        .cs-upcoming-title {
          font-size: 11px; font-weight: 700; color: #5a6080;
          text-transform: uppercase; letter-spacing: 0.9px;
          margin: 0; padding: 14px 20px; border-bottom: 1px solid #1e2130;
          background: #111520;
        }
        .cs-uc-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px; border-bottom: 1px solid #111520;
          transition: background 0.15s;
        }
        .cs-uc-row:last-child { border-bottom: none; }
        .cs-uc-row:hover { background: #1c2138; }
        .cs-uc-bar { width: 4px; height: 40px; border-radius: 2px; flex-shrink: 0; }
        .cs-uc-body { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; overflow: hidden; }
        .cs-uc-guest { font-size: 14px; font-weight: 600; color: #e8e3d9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cs-uc-meta  { font-size: 11px; color: #5a6080; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cs-uc-chip  { font-size: 11px; font-weight: 700; padding: 4px 11px; border-radius: 20px; border: 1px solid; white-space: nowrap; flex-shrink: 0; }

        /* iCal section */
        .cs-ical-card {
          background: #161924; border: 1px solid #1e2130; border-radius: 14px; padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .cs-ical-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .cs-ical-title { font-size: 15px; font-weight: 700; color: #c8c3b8; margin: 0 0 4px; }
        .cs-ical-sub   { font-size: 12px; color: #5a6080; margin: 0; }

        .cs-btn-add {
          padding: 9px 18px; background: #81b29a; border: none; border-radius: 8px;
          color: #0f1117; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: inherit; white-space: nowrap; transition: opacity 0.15s;
        }
        .cs-btn-add:hover { opacity: 0.88; }

        /* Add form */
        .cs-form {
          background: #111520; border: 1px solid #2a3050; border-radius: 10px; padding: 18px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .cs-form-heading { font-size: 10px; font-weight: 700; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 4px; }
        .cs-platform-grid { display: flex; flex-wrap: wrap; gap: 7px; }
        .cs-plat-abbr { font-size: 10px; font-weight: 800; letter-spacing: 0.02em; }
        .cs-plat-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; background: #1e2130;
          border: 1px solid #2a3050; border-radius: 6px;
          color: #8a9080; font-size: 12px; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .cs-plat-btn:hover { border-color: #4a5068; color: #c8c3b8; }
        .cs-url-input {
          padding: 10px 12px; background: #1e2130;
          border: 1px solid #2a3050; border-radius: 8px;
          color: #e8e3d9; font-size: 13px; font-family: inherit;
          outline: none; width: 100%; box-sizing: border-box;
        }
        .cs-url-input:focus { border-color: #81b29a; }
        .cs-form-hint { font-size: 11px; color: #4a5068; margin: 0; }
        .cs-form-btns { display: flex; justify-content: flex-end; }

        /* Source list */
        .cs-sources { display: flex; flex-direction: column; gap: 8px; }
        .cs-src-row {
          background: #111520; border: 1px solid #1e2130; border-radius: 8px; padding: 12px 14px;
          display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap;
        }
        .cs-src-err { border-color: #e07a5f44; background: #1a100f; }
        .cs-result-banner { font-size: 11px; color: #81b29a; margin-top: 4px; }
        .cs-error-banner  { font-size: 11px; color: #e07a5f; margin-top: 4px; line-height: 1.4; }
        .cs-src-badge { display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 6px; border: 1px solid; flex-shrink: 0; }
        .cs-src-info  { flex: 1; min-width: 0; }
        .cs-src-url   { display: block; font-size: 11px; color: #5a6080; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
        .cs-src-status { display: flex; align-items: center; gap: 6px; }
        .cs-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .cs-dot-synced  { background: #81b29a; }
        .cs-dot-error   { background: #e07a5f; }
        .cs-dot-pending { background: #f2cc8f; }
        .cs-status-lbl  { font-size: 11px; color: #4a5068; }
        .cs-src-acts { display: flex; gap: 8px; flex-shrink: 0; }
        .cs-sync-btn {
          padding: 5px 12px; background: #1e2130; border: 1px solid #2a3050; border-radius: 6px;
          color: #81b29a; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .cs-syncing { opacity: 0.6; animation: cs-spin 1s linear infinite; }
        @keyframes cs-spin { to { transform: rotate(360deg); } }
        .cs-rm-btn {
          padding: 5px 10px; background: none; border: 1px solid #2a3050; border-radius: 6px;
          color: #4a5068; font-size: 12px; cursor: pointer; transition: all 0.15s;
        }
        .cs-rm-btn:hover { border-color: #e07a5f; color: #e07a5f; }

        .cs-ical-empty {
          border: 1px dashed #2a3050; border-radius: 8px; padding: 20px;
          text-align: center; color: #4a5068; font-size: 12px;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .cs-ical-empty span { font-size: 24px; }

        /* Responsive */
        @media (max-width: 640px) {
          .cs-page-header { flex-direction: column; }
          .cs-grid { padding: 4px 4px 8px; gap: 1px; }
          .cs-cell { height: 38px; font-size: 11px; }
          .cs-day-num { width: 26px; height: 26px; }
          .cs-today-num { width: 26px; height: 26px; }
          .cs-uc-row { padding: 10px 14px; gap: 10px; }
          .cs-ical-card { padding: 14px; }
          .cs-legend { padding: 10px 14px; }
          .cs-dow-row { padding: 10px 4px 4px; }
          .cs-dow { font-size: 9px; }
          .cs-header-kpis { align-self: flex-start; }
        }
        @media (max-width: 400px) {
          .cs-cell { height: 34px; font-size: 10px; }
          .cs-day-num { width: 22px; height: 22px; font-size: 10px; }
          .cs-today-num { width: 22px; height: 22px; }
          .cs-cal-nav { padding: 12px 14px; }
          .cs-nav-label { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
