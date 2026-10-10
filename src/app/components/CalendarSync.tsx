"use client";

import { useState } from "react";
import { Booking } from "./BookingTracker";

/* Legacy type — kept so existing parent imports don't break.
   Nothing in this file uses it any more. */
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

interface CalendarProps {
  listingId: string;
  bookings?: Booking[];
  /* Deprecated props — accepted but ignored, so call sites don't fail to
     compile. Strip them from the parent at your leisure. */
  sources?: CalendarSource[];
  onAddSource?: (source: Omit<CalendarSource, "id" | "lastSynced" | "status">) => void;
  onRemoveSource?: (id: string) => void;
  onSync?: (id: string, updates?: Partial<CalendarSource>) => void;
  onImportBookings?: (bookings: unknown[]) => { added: number; skipped: number };
}

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
      if (sameDay)                       type = "single";
      else if (t === checkIn.getTime())  type = "checkIn";
      else if (t === checkOut.getTime()) type = "checkOut";
      if (!map[key]) map[key] = { color, type, guestName: b.guestName, bookingId: b.id, source: b.source };
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
}

export default function CalendarSync({ bookings = [] }: CalendarProps) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [tooltip,   setTooltip]   = useState<{ key: string; text: string } | null>(null);

  const dayMap   = buildDayMap(bookings);
  const todayKey = today.toISOString().split("T")[0];

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

  const monthPfx = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthBookings = bookings.filter(
    (b) => b.status !== "cancelled" &&
      (b.checkIn.startsWith(monthPfx) || b.checkOut.startsWith(monthPfx) ||
      (b.checkIn < monthPfx + "-01" && b.checkOut > monthPfx + "-31"))
  );

  const upcomingBookings = bookings
    .filter((b) => b.status !== "cancelled" && b.checkIn >= todayKey)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const confirmedCount = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;

  return (
    <div className="cs-root">

      {/* ── Page header ── */}
      <div className="cs-page-header">
        <div>
          <h2 className="cs-title">Availability Calendar</h2>
          <p className="cs-desc">Every booking you log blocks its dates here automatically.</p>
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

        <div className="cs-cal-nav">
          <button className="cs-nav-arrow" onClick={prevMonth} aria-label="Previous month">‹</button>
          <div className="cs-nav-mid">
            <span className="cs-nav-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            {!isCurrentView && (
              <button className="cs-nav-today-btn" onClick={goToday}>Today</button>
            )}
          </div>
          <button className="cs-nav-arrow" onClick={nextMonth} aria-label="Next month">›</button>
        </div>

        <div className="cs-dow-row">
          {DAYS.map((d) => <span key={d} className="cs-dow">{d}</span>)}
        </div>

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

      <style jsx>{`
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

        .cs-dow-row {
          display: grid; grid-template-columns: repeat(7, 1fr);
          padding: 12px 16px 4px; background: #111520;
        }
        .cs-dow { text-align: center; font-size: 10px; font-weight: 700; color: #4a5068; text-transform: uppercase; letter-spacing: 0.8px; }

        .cs-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          padding: 4px 10px 10px; gap: 2px;
        }

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

        .cs-today-num {
          background: #81b29a !important;
          color: #0f1117 !important;
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }
        .cs-today { color: #e8e3d9; }

        .cs-day-num {
          position: relative; z-index: 1;
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
        }

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

        .cs-bk-checkIn .cs-day-num,
        .cs-bk-single .cs-day-num {
          background: var(--c, #81b29a) !important;
          color: #fff !important;
          opacity: 1;
          font-weight: 700;
        }
        .cs-bk-checkOut .cs-day-num {
          background: color-mix(in srgb, var(--c) 55%, transparent) !important;
          color: #fff !important;
          font-weight: 600;
        }
        .cs-bk-mid .cs-day-num {
          background: color-mix(in srgb, var(--c) 30%, transparent) !important;
          color: #fff !important;
        }

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

        .cs-legend {
          border-top: 1px solid #1e2130; padding: 12px 18px;
          display: flex; flex-direction: column; gap: 7px;
        }
        .cs-legend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; min-width: 0; overflow: hidden; }
        .cs-legend-pip { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .cs-legend-name { color: #c8c3b8; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
        .cs-legend-info { color: #5a6080; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cs-legend-nights { color: #4a5068; font-size: 11px; flex-shrink: 0; }

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

        @media (max-width: 640px) {
          .cs-page-header { flex-direction: column; }
          .cs-grid { padding: 4px 4px 8px; gap: 1px; }
          .cs-cell { height: 38px; font-size: 11px; }
          .cs-day-num { width: 26px; height: 26px; }
          .cs-today-num { width: 26px; height: 26px; }
          .cs-uc-row { padding: 10px 14px; gap: 10px; }
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