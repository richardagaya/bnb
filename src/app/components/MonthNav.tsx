"use client";

import { useState, useCallback, useRef } from "react";
import { useDismissOnEscape, useDismissOnClickOutside } from "@/lib/useDismiss";

interface MonthNavProps {
  /** Selected month as "YYYY-MM". */
  month: string;
  onChange: (month: string) => void;
  /** Accent colour used for the active/today highlights. */
  accentColor?: string;
  /** Months that contain data — rendered with a small dot in the picker. */
  dataMonths?: Set<string>;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function MonthNav({
  month,
  onChange,
  accentColor = "#81b29a",
  dataMonths,
}: MonthNavProps) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const todayKey = monthKey(now);
  const isCurrentMonth = month === todayKey;

  const [year, mon] = month.split("-").map(Number);

  const shift = (delta: number) => {
    const d = new Date(year, mon - 1 + delta, 1);
    onChange(monthKey(d));
    setOpen(false);
  };

  // Build a 12-month strip (current month − 5 … + 6) for the picker.
  const stripMonths: string[] = [];
  for (let i = -5; i <= 6; i++) {
    stripMonths.push(monthKey(new Date(now.getFullYear(), now.getMonth() + i, 1)));
  }

  const hasData = dataMonths?.has(month);

  const closePicker = useCallback(() => setOpen(false), []);
  useDismissOnEscape(open, closePicker);
  useDismissOnClickOutside(pickerRef, open, closePicker);

  return (
    <div className="mn-root">
      <button className="mn-arrow" onClick={() => shift(-1)} aria-label="Previous month">‹</button>

      <div className="mn-picker-wrap" ref={pickerRef}>
        <button
          className={`mn-filter-btn${open ? " open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={open ? { borderColor: `${accentColor}55` } : {}}
        >
          <span className="mn-filter-label">{monthLabel(month)}</span>
          {hasData && <span className="mn-filter-dot" style={{ background: accentColor }} />}
          <span className="mn-filter-chevron">{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <>
            <div className="mn-backdrop" onClick={() => setOpen(false)} />
            <div className="mn-dropdown" role="listbox">
              {stripMonths.map((mk) => {
                const isSelected = mk === month;
                const isToday = mk === todayKey;
                const dot = dataMonths?.has(mk);
                return (
                  <button
                    key={mk}
                    role="option"
                    aria-selected={isSelected}
                    className={`mn-item${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
                    onClick={() => { onChange(mk); setOpen(false); }}
                    style={isSelected || isToday ? { color: accentColor } : {}}
                  >
                    <span className="mn-item-label">{monthLabel(mk)}</span>
                    <span className="mn-item-right">
                      {isToday && (
                        <span
                          className="mn-tag"
                          style={{ color: accentColor, background: `${accentColor}18`, borderColor: `${accentColor}44` }}
                        >
                          Current
                        </span>
                      )}
                      {dot && <span className="mn-data-dot" style={{ background: accentColor }} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <button className="mn-arrow" onClick={() => shift(1)} aria-label="Next month">›</button>

      {!isCurrentMonth && (
        <button
          className="mn-today"
          onClick={() => { onChange(todayKey); setOpen(false); }}
          style={{ color: accentColor }}
        >
          Today
        </button>
      )}

      <style jsx>{`
        .mn-root {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #111520;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 8px 10px;
          font-family: 'DM Sans', sans-serif;
        }
        .mn-arrow {
          background: #1e2130;
          border: none;
          color: #8899aa;
          font-size: 18px;
          line-height: 1;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .mn-arrow:hover { background: #2a3050; color: #e8e3d9; }
        .mn-arrow:focus-visible { outline: 2px solid #81b29a; outline-offset: 2px; }

        .mn-picker-wrap { flex: 1; position: relative; min-width: 0; }
        .mn-filter-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.15s, background 0.15s;
          text-align: left;
        }
        .mn-filter-btn:hover, .mn-filter-btn.open { background: #1c2540; }
        .mn-filter-btn:focus-visible { outline: 2px solid #81b29a; outline-offset: 2px; }
        .mn-filter-label {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #e8e3d9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mn-filter-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .mn-filter-chevron { font-size: 9px; color: #5a6080; flex-shrink: 0; }

        .mn-backdrop { position: fixed; inset: 0; z-index: 49; }
        .mn-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.55);
          z-index: 50;
          overflow: hidden;
          max-height: 320px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #2a3050 transparent;
        }
        .mn-dropdown::-webkit-scrollbar { width: 4px; }
        .mn-dropdown::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 2px; }

        .mn-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 14px;
          background: none;
          border: none;
          border-bottom: 1px solid #1e2130;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: background 0.12s;
        }
        .mn-item:last-child { border-bottom: none; }
        .mn-item:hover { background: #1c2138; }
        .mn-item.selected { background: #1a2430; }
        .mn-item-label { font-size: 13px; color: #8a9080; }
        .mn-item.selected .mn-item-label,
        .mn-item.today .mn-item-label { font-weight: 600; color: inherit; }
        .mn-item-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .mn-tag {
          font-size: 10px;
          font-weight: 600;
          border: 1px solid;
          border-radius: 4px;
          padding: 1px 6px;
          white-space: nowrap;
        }
        .mn-data-dot { width: 6px; height: 6px; border-radius: 50%; opacity: 0.7; }

        .mn-today {
          background: #1e2130;
          border: 1px solid #2a3050;
          font-size: 11px;
          font-family: inherit;
          font-weight: 600;
          padding: 6px 11px;
          border-radius: 8px;
          cursor: pointer;
          flex-shrink: 0;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .mn-today:hover { background: #2a3050; }
        .mn-today:focus-visible { outline: 2px solid #81b29a; outline-offset: 2px; }

        @media (max-width: 600px) {
          .mn-root { padding: 6px 8px; gap: 6px; }
          .mn-arrow { width: 28px; height: 28px; font-size: 16px; }
          .mn-filter-label { font-size: 13px; }
          .mn-today { font-size: 10px; padding: 5px 8px; }
        }
      `}</style>
    </div>
  );
}
