"use client";

import { useState } from "react";
import MonthNav from "./MonthNav";
import { formatCurrency as fmtMoney, currencySymbol } from "@/lib/currency";

interface GoalsPanelProps {
  month: string;
  onMonthChange: (month: string) => void;
  dataMonths?: Set<string>;
  target: number;
  onSaveTarget: (amount: number) => void;
  bookingRevenue: number;
  referralRevenue: number;
  currency?: string;
  accentColor?: string;
}

export default function GoalsPanel({
  month,
  onMonthChange,
  dataMonths,
  target,
  onSaveTarget,
  bookingRevenue,
  referralRevenue,
  currency,
  accentColor = "#81B29A",
}: GoalsPanelProps) {
  const fmt = (n: number) => fmtMoney(n, currency);
  const symbol = currencySymbol(currency);
  const collected = bookingRevenue + referralRevenue;
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  const percent = target > 0 ? Math.round((collected / target) * 100) : 0;
  const barWidth = Math.min(100, Math.max(0, percent));
  const remaining = Math.max(0, target - collected);
  const reached = target > 0 && collected >= target;

  const save = () => {
    const amount = Number(draft);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onSaveTarget(amount);
    setDraft("");
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(target > 0 ? String(target) : "");
    setEditing(true);
  };

  return (
    <div className="goals-root">
      <div className="goals-head">
        <div>
          <h2 className="goals-title">Goals</h2>
          <p className="goals-desc">
            Set the revenue you want this month. Progress uses money collected from bookings and referrals.
          </p>
        </div>
      </div>

      <MonthNav
        month={month}
        onChange={onMonthChange}
        accentColor={accentColor}
        dataMonths={dataMonths}
      />

      {target <= 0 || editing ? (
        <form
          className="goals-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="goals-label" htmlFor="goal-target">
            Monthly revenue target
          </label>
          <div className="goals-form-row">
            <div className="goals-input-wrap">
              <span>{symbol}</span>
              <input
                id="goal-target"
                type="number"
                min="1"
                step="1"
                inputMode="decimal"
                placeholder="40000"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <button type="submit" className="goals-save" disabled={Number(draft) <= 0}>
              Save target
            </button>
            {editing && target > 0 && (
              <button type="button" className="goals-cancel" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <section className="goals-card" aria-label="Monthly revenue goal">
          <div className="goals-card-top">
            <div>
              <p className="goals-kicker">Target</p>
              <p className="goals-target">{fmt(target)}</p>
            </div>
            <button type="button" className="goals-edit" onClick={startEdit}>
              Edit
            </button>
          </div>

          <div className="goals-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={barWidth} aria-label="Revenue progress">
            <div className="goals-bar-fill" style={{ width: `${barWidth}%`, background: reached ? "#81B29A" : accentColor }} />
          </div>

          <div className="goals-stats">
            <p className="goals-percent" style={{ color: reached ? "#81B29A" : "#e8e3d9" }}>
              {percent}%
            </p>
            <p className="goals-collected">
              {fmt(collected)} collected
              {reached ? " · target reached" : ` · ${fmt(remaining)} to go`}
            </p>
          </div>

          <div className="goals-split">
            <div>
              <span>Bookings</span>
              <strong>{fmt(bookingRevenue)}</strong>
            </div>
            <div>
              <span>Referrals</span>
              <strong>{fmt(referralRevenue)}</strong>
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        .goals-root { display: flex; flex-direction: column; gap: 16px; }
        .goals-title { margin: 0; font-size: 22px; color: #e8e3d9; }
        .goals-desc { margin: 6px 0 0; font-size: 13px; color: #8b93a7; max-width: 520px; line-height: 1.5; }
        .goals-form, .goals-card {
          background: #111520;
          border: 1px solid #1e2130;
          border-radius: 14px;
          padding: 18px;
        }
        .goals-label { display: block; font-size: 12px; color: #8b93a7; margin-bottom: 8px; }
        .goals-form-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .goals-input-wrap {
          display: flex; align-items: center; gap: 8px;
          background: #0c0e14; border: 1px solid #2a3050; border-radius: 10px;
          padding: 0 12px; min-width: 180px;
        }
        .goals-input-wrap span { color: #8b93a7; font-size: 13px; }
        .goals-input-wrap input {
          flex: 1; background: transparent; border: 0; color: #e8e3d9;
          font: inherit; font-size: 16px; padding: 12px 0; outline: none; width: 120px;
        }
        .goals-save, .goals-cancel, .goals-edit {
          border-radius: 10px; font: inherit; font-size: 13px; font-weight: 650;
          padding: 11px 14px; cursor: pointer;
        }
        .goals-save { background: ${accentColor}; color: #0c0e14; border: 0; }
        .goals-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .goals-cancel, .goals-edit {
          background: transparent; color: #c8c3b8; border: 1px solid #2a3050;
        }
        .goals-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .goals-kicker { margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b93a7; }
        .goals-target { margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #e8e3d9; }
        .goals-bar {
          margin-top: 18px; height: 12px; border-radius: 999px;
          background: #1e2130; overflow: hidden;
        }
        .goals-bar-fill { height: 100%; border-radius: 999px; transition: width 0.25s ease; }
        .goals-stats { display: flex; align-items: baseline; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
        .goals-percent { margin: 0; font-size: 22px; font-weight: 700; }
        .goals-collected { margin: 0; font-size: 13px; color: #8b93a7; }
        .goals-split {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px;
        }
        .goals-split div {
          background: #0c0e14; border-radius: 10px; padding: 12px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .goals-split span { font-size: 12px; color: #8b93a7; }
        .goals-split strong { font-size: 16px; color: #e8e3d9; }
      `}</style>
    </div>
  );
}
