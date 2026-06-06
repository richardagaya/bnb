"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface DatePickerProps {
  value: string;          // YYYY-MM-DD or ""
  onChange: (val: string) => void;
  min?: string;           // YYYY-MM-DD
  max?: string;           // YYYY-MM-DD
  placeholder?: string;
  /** Second selected date — highlights range between value and rangeEnd */
  rangeEnd?: string;
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDisplay(s: string) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  rangeEnd,
}: DatePickerProps) {
  const today    = new Date();
  const todayKey = toKey(today);

  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  // View state — month/year shown in popup
  const initView = useCallback(() => {
    const d = value ? new Date(value + "T00:00:00") : today;
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const [view, setView] = useState(initView);

  // Position popup under the trigger using fixed coords
  const openPicker = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const popupHeight = 340;
    const spaceBelow  = window.innerHeight - r.bottom - 8;
    const top = spaceBelow >= popupHeight ? r.bottom + 6 : r.top - popupHeight - 6;
    setPos({ top, left: r.left, width: Math.max(r.width, 272) });
    const d = value ? new Date(value + "T00:00:00") : today;
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setOpen(true);
  };

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const popup = document.getElementById("dp-popup-portal");
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (popup?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  // Build grid
  const firstDow    = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectDay = (day: number) => {
    const key = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (min && key < min) return;
    if (max && key > max) return;
    onChange(key);
    setOpen(false);
  };

  const selectToday = () => {
    if ((min && todayKey < min) || (max && todayKey > max)) return;
    onChange(todayKey);
    setOpen(false);
  };

  const canGoToday = (!min || todayKey >= min) && (!max || todayKey <= max);

  const rangeMin = value && rangeEnd ? (value < rangeEnd ? value : rangeEnd) : null;
  const rangeMax = value && rangeEnd ? (value < rangeEnd ? rangeEnd : value) : null;

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className="dp-trigger"
        onClick={openPicker}
      >
        <span className={value ? "dp-val" : "dp-ph"}>{value ? fmtDisplay(value) : placeholder}</span>
        <svg className="dp-icon" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Portal popup — rendered via a div injected into body */}
      {open && typeof window !== "undefined" && (
        <PopupPortal>
          <div
            id="dp-popup-portal"
            data-outside-click-ignore
            style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
            className="dp-popup"
          >
            {/* Month nav */}
            <div className="dp-nav">
              <button type="button" className="dp-arrow" onClick={prevMonth}>‹</button>
              <span className="dp-nav-label">{MONTHS[view.month]} {view.year}</span>
              <button type="button" className="dp-arrow" onClick={nextMonth}>›</button>
            </div>

            {/* Day-of-week headers */}
            <div className="dp-dow-row">
              {DAYS.map(d => <span key={d} className="dp-dow">{d}</span>)}
            </div>

            {/* Day grid */}
            <div className="dp-grid">
              {cells.map((day, idx) => {
                if (day === null) return <div key={`e${idx}`} />;
                const key      = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSel    = key === value;
                const isT      = key === todayKey && !isSel;
                const disabled = (!!min && key < min) || (!!max && key > max);
                const inRange  = !!rangeMin && !!rangeMax && key > rangeMin && key < rangeMax;
                const isRangeEnd = key === rangeMax && key !== value;
                return (
                  <button
                    key={key}
                    type="button"
                    className={[
                      "dp-day",
                      isSel      ? "dp-sel"      : "",
                      isT        ? "dp-today"    : "",
                      disabled   ? "dp-disabled" : "",
                      inRange    ? "dp-in-range" : "",
                      isRangeEnd ? "dp-range-end": "",
                    ].join(" ")}
                    onClick={() => !disabled && selectDay(day)}
                    disabled={disabled}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="dp-footer">
              <button
                type="button"
                className="dp-foot-btn dp-today-btn"
                onClick={selectToday}
                disabled={!canGoToday}
              >
                Today
              </button>
              {value && (
                <button
                  type="button"
                  className="dp-foot-btn dp-clear-btn"
                  onClick={() => { onChange(""); setOpen(false); }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      <style jsx global>{`
        /* Trigger */
        .dp-trigger {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 10px 12px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 8px;
          color: #e8e3d9;
          font-size: 13px; font-family: inherit;
          cursor: pointer; text-align: left;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .dp-trigger:hover, .dp-trigger:focus-visible {
          border-color: #81b29a; outline: none;
        }
        .dp-val { flex: 1; color: #e8e3d9; }
        .dp-ph  { flex: 1; color: #4a5068; }
        .dp-icon { width: 16px; height: 16px; color: #5a6080; flex-shrink: 0; }

        /* Popup */
        .dp-popup {
          position: fixed;
          z-index: 9999;
          background: #1a1f2e;
          border: 1px solid #2a3050;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04);
          animation: dp-appear 0.12s ease;
        }
        @keyframes dp-appear {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        /* Nav */
        .dp-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          background: #111520;
          border-bottom: 1px solid #2a3050;
        }
        .dp-arrow {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          background: #1e2130; border: 1px solid #2a3050; border-radius: 7px;
          color: #8a9080; font-size: 18px; cursor: pointer;
          font-family: inherit; transition: all 0.13s;
        }
        .dp-arrow:hover { background: #2a3050; color: #e8e3d9; }
        .dp-nav-label { font-size: 15px; font-weight: 700; color: #e8e3d9; }

        /* Day-of-week */
        .dp-dow-row {
          display: grid; grid-template-columns: repeat(7, 1fr);
          padding: 10px 12px 2px;
          background: #111520;
        }
        .dp-dow { text-align: center; font-size: 10px; font-weight: 700; color: #4a5068; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Grid */
        .dp-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          padding: 6px 12px 8px;
        }

        /* Day cells */
        .dp-day {
          height: 36px; width: 100%;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; border-radius: 50%;
          font-size: 13px; color: #8a9080;
          cursor: pointer; font-family: inherit;
          transition: background 0.1s, color 0.1s;
        }
        .dp-day:not(.dp-disabled):hover {
          background: #2a3050; color: #e8e3d9;
        }
        .dp-disabled { opacity: 0.28; cursor: not-allowed; }
        .dp-today {
          color: #81b29a; font-weight: 700;
          box-shadow: inset 0 0 0 1.5px #81b29a77;
        }
        .dp-sel {
          background: #81b29a !important;
          color: #0f1117 !important;
          font-weight: 700;
        }
        .dp-in-range {
          background: #81b29a1a !important;
          border-radius: 0 !important;
          color: #a8d4bc;
        }
        .dp-range-end {
          background: #81b29a44 !important;
          color: #c8e8d5 !important;
          font-weight: 600;
        }

        /* Footer */
        .dp-footer {
          display: flex; justify-content: center; gap: 10px;
          padding: 8px 12px 12px;
          border-top: 1px solid #1e2130;
          background: #111520;
        }
        .dp-foot-btn {
          background: none; border: 1px solid; border-radius: 6px;
          padding: 5px 16px; font-size: 12px; font-family: inherit;
          cursor: pointer; transition: all 0.13s;
        }
        .dp-today-btn { color: #81b29a; border-color: #81b29a44; }
        .dp-today-btn:hover:not(:disabled) { background: #81b29a18; }
        .dp-today-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .dp-clear-btn { color: #5a6080; border-color: #2a3050; }
        .dp-clear-btn:hover { border-color: #e07a5f66; color: #e07a5f; }
      `}</style>
    </>
  );
}

// Lightweight portal — appends to document.body
function PopupPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    elRef.current = div;
    setMounted(true);
    return () => { document.body.removeChild(div); };
  }, []);

  if (!mounted || !elRef.current) return null;

  const { createPortal } = require("react-dom");
  return createPortal(children, elRef.current);
}
