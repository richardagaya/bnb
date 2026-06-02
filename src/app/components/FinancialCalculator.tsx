"use client";

import { useState, useMemo } from "react";
import { formatCurrency as fmtMoney, currencySymbol } from "@/lib/currency";

export interface FinancialData {
  furnitureCost: number;
  transportCost: number;
  installationCost: number;
  setupUtilitiesCost: number;
  miscellaneousCost: number;
  rentDepositCost: number;
  chargePerStay: number;
  projectedStaysPerMonth: number;
  discountPercent: number;
  monthlyRent: number;
  monthlyUtilities: number;
  monthlyCleaner: number;
}

interface FinancialCalculatorProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  /** Account currency code (ISO 4217). */
  currency?: string;
}

const COST_FIELDS: { key: keyof FinancialData; label: string; hint?: string }[] = [
  { key: "furnitureCost", label: "Furniture" },
  { key: "transportCost", label: "Transport" },
  { key: "installationCost", label: "Installation" },
  { key: "setupUtilitiesCost", label: "Utilities", hint: "WiFi, water and other setup costs" },
  { key: "miscellaneousCost", label: "Miscellaneous" },
  { key: "rentDepositCost", label: "Rent + Deposit" },
];

const EXPENSE_FIELDS: { key: keyof FinancialData; label: string }[] = [
  { key: "monthlyRent", label: "Rent" },
  { key: "monthlyUtilities", label: "Utilities" },
  { key: "monthlyCleaner", label: "Cleaner" },
];

export default function FinancialCalculator({ data, onChange, currency: currencyCode }: FinancialCalculatorProps) {
  const fmt = (n: number) => fmtMoney(n, currencyCode);
  const symbol = currencySymbol(currencyCode);
  const [draft, setDraft] = useState<FinancialData>(data);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof FinancialData, raw: string) => {
    setDraft((prev) => ({ ...prev, [key]: raw === "" ? 0 : parseFloat(raw) || 0 }));
    setSaved(false);
  };

  const handleSave = () => {
    onChange(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const totalCapital = useMemo(
    () =>
      draft.furnitureCost +
      draft.transportCost +
      draft.installationCost +
      draft.setupUtilitiesCost +
      draft.miscellaneousCost +
      draft.rentDepositCost,
    [draft]
  );

  const totalMonthlyExpenses = useMemo(
    () => draft.monthlyRent + draft.monthlyUtilities + draft.monthlyCleaner,
    [draft]
  );

  const platformFeeAmt = draft.chargePerStay * (draft.discountPercent / 100);
  const netPerStay = draft.chargePerStay - platformFeeAmt;
  const projectedMonthlyRevenue = netPerStay * draft.projectedStaysPerMonth;
  const projectedMonthlyProfit = projectedMonthlyRevenue - totalMonthlyExpenses;

  return (
    <div className="financial-calc">
      {/* ── HEADER ── */}
      <div className="calc-header">
        <div>
          <h2 className="section-title">Finance Setup</h2>
          <p className="section-desc">
            Set your pricing, setup costs, and monthly expenses. The{" "}
            <strong>Summary</strong> tab uses these numbers to calculate your P&amp;L automatically.
          </p>
        </div>
        <button className={`save-btn ${saved ? "saved" : ""}`} onClick={handleSave}>
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>

      <div className="input-sections">

        {/* ── Pricing Per Stay ── */}
        <section className="input-group pricing-group">
          <div className="group-heading">
            <h3 className="group-title">Pricing Per Stay</h3>
            <p className="group-desc">
              Your listed charge per booking and any platform fee deducted by Airbnb, Booking.com, etc.
              Individual guest discounts are tracked per booking in the Bookings tab.
            </p>
          </div>

          <div className="pricing-layout">
            <div className="pricing-inputs">
              {/* Charge per stay */}
              <div className="field">
                <label className="field-label">Price Per Stay</label>
                <div className="input-wrap">
                  <span className="prefix">{symbol}</span>
                  <input
                    type="number"
                    min="0"
                    className="field-input"
                    value={draft.chargePerStay === 0 ? "" : draft.chargePerStay}
                    placeholder="0"
                    onChange={(e) => update("chargePerStay", e.target.value)}
                  />
                </div>
                <p className="field-hint">The full amount you charge a guest per booking</p>
              </div>

              {/* Platform fee */}
              <div className="field">
                <label className="field-label">Platform Fee</label>
                <div className="input-wrap suffix-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="field-input"
                    value={draft.discountPercent === 0 ? "" : draft.discountPercent}
                    placeholder="0"
                    onChange={(e) => update("discountPercent", e.target.value)}
                  />
                  <span className="suffix">%</span>
                </div>
                <p className="field-hint">e.g. Airbnb service fee 3%, Booking.com 15%</p>
              </div>

              {/* Projected stays */}
              <div className="field">
                <label className="field-label">Projected Stays / Month</label>
                <div className="input-wrap">
                  <input
                    type="number"
                    min="0"
                    className="field-input"
                    style={{ paddingLeft: 12 }}
                    value={draft.projectedStaysPerMonth === 0 ? "" : draft.projectedStaysPerMonth}
                    placeholder="0"
                    onChange={(e) => update("projectedStaysPerMonth", e.target.value)}
                  />
                </div>
                <p className="field-hint">How many bookings you expect per month</p>
              </div>
            </div>

            {/* Live preview panel */}
            <div className="pricing-preview">
              <div className="preview-row">
                <span className="preview-label">Price per stay</span>
                <span className="preview-val">{fmt(draft.chargePerStay)}</span>
              </div>
              {draft.discountPercent > 0 && (
                <div className="preview-row preview-deduct">
                  <span className="preview-label">Platform fee ({draft.discountPercent}%)</span>
                  <span className="preview-val preview-neg">− {fmt(platformFeeAmt)}</span>
                </div>
              )}
              <div className="preview-divider" />
              <div className="preview-row preview-net">
                <span className="preview-label">You receive / stay</span>
                <span className="preview-val preview-pos">{fmt(netPerStay)}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">× {draft.projectedStaysPerMonth} stays/mo</span>
                <span className="preview-val">{fmt(projectedMonthlyRevenue)}</span>
              </div>
              <div className="preview-divider" />
              <div className="preview-row preview-profit">
                <span className="preview-label">Projected profit/mo</span>
                <span
                  className="preview-val"
                  style={{ color: projectedMonthlyProfit >= 0 ? "#81b29a" : "#e07a5f" }}
                >
                  {fmt(projectedMonthlyProfit)}
                </span>
              </div>
              <p className="preview-note">
                After fixed costs · discounts per guest tracked in Bookings
              </p>
            </div>
          </div>
        </section>

        {/* ── Initial Setup Capital ── */}
        <section className="input-group">
          <div className="group-heading">
            <h3 className="group-title">Initial Setup Capital</h3>
            <p className="group-desc">One-time costs to get the property ready.</p>
          </div>
          <div className="fields-grid">
            {COST_FIELDS.map(({ key, label, hint }) => (
              <div key={key} className="field">
                <label className="field-label">{label}</label>
                <div className="input-wrap">
                  <span className="prefix">{symbol}</span>
                  <input
                    type="number"
                    min="0"
                    className="field-input"
                    value={draft[key] === 0 ? "" : draft[key]}
                    placeholder="0"
                    onChange={(e) => update(key, e.target.value)}
                  />
                </div>
                {hint && <p className="field-hint">{hint}</p>}
              </div>
            ))}
          </div>
          <div className="section-total">
            <span>Total capital invested</span>
            <span className="section-total-value">{fmt(totalCapital)}</span>
          </div>
        </section>

        {/* ── Monthly Operating Expenses ── */}
        <section className="input-group">
          <div className="group-heading">
            <h3 className="group-title">Monthly Operating Expenses</h3>
            <p className="group-desc">Recurring costs of running the business each month.</p>
          </div>
          <div className="fields-grid compact">
            {EXPENSE_FIELDS.map(({ key, label }) => (
              <div key={key} className="field">
                <label className="field-label">{label}</label>
                <div className="input-wrap">
                  <span className="prefix">{symbol}</span>
                  <input
                    type="number"
                    min="0"
                    className="field-input"
                    value={draft[key] === 0 ? "" : draft[key]}
                    placeholder="0"
                    onChange={(e) => update(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="section-total">
            <span>Total monthly expenses</span>
            <span className="section-total-value">{fmt(totalMonthlyExpenses)}</span>
          </div>
        </section>
      </div>

      <style jsx>{`
        .financial-calc {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── HEADER ── */
        .calc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }
        .section-title {
          font-size: 22px;
          font-weight: 700;
          color: #e8e3d9;
          margin: 0 0 6px;
        }
        .section-desc {
          font-size: 13px;
          color: #7a8090;
          margin: 0;
          max-width: 520px;
          line-height: 1.6;
        }
        .section-desc strong { color: #a0a8b8; }
        .save-btn {
          padding: 10px 22px;
          background: #81b29a;
          border: none;
          border-radius: 8px;
          color: #0f1117;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: background 0.2s, transform 0.1s;
          flex-shrink: 0;
        }
        .save-btn:hover { background: #6fa085; }
        .save-btn:active { transform: scale(0.97); }
        .save-btn.saved { background: #4a8060; color: #c8f0dc; }

        /* ── PRICING SECTION ── */
        .pricing-group { border-color: #81b29a33; }
        .pricing-layout {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: start;
        }
        .pricing-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .suffix-wrap { }
        .suffix {
          padding: 0 12px;
          font-size: 12px;
          font-weight: 600;
          color: #a0a8c0;
          white-space: nowrap;
          background: #1e2340;
          display: flex;
          align-items: center;
          user-select: none;
          border-left: 1.5px solid #5060a0;
          flex-shrink: 0;
        }

        /* Live preview panel */
        .pricing-preview {
          background: #0f1117;
          border: 1px solid #2a3050;
          border-radius: 10px;
          padding: 16px 18px;
          min-width: 210px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }
        .preview-label { color: #5a6080; white-space: nowrap; }
        .preview-val { font-weight: 600; color: #e8e3d9; white-space: nowrap; }
        .preview-pos { color: #81b29a; }
        .preview-neg { color: #e07a5f; }
        .preview-deduct .preview-label { color: #4a5068; font-size: 12px; }
        .preview-deduct .preview-val  { font-size: 12px; }
        .preview-net .preview-label { color: #c8c3b8; font-weight: 600; }
        .preview-net .preview-val   { font-size: 15px; }
        .preview-profit .preview-label { color: #c8c3b8; font-weight: 700; }
        .preview-profit .preview-val   { font-size: 16px; font-weight: 800; }
        .preview-divider { border-top: 1px solid #2a3050; margin: 2px 0; }
        .preview-note { font-size: 11px; color: #3a4060; margin: 4px 0 0; line-height: 1.4; }

        @media (max-width: 800px) {
          .pricing-layout { grid-template-columns: 1fr; }
          .pricing-preview { min-width: unset; }
        }

        /* ── INPUT SECTIONS ── */
        .input-sections {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-group {
          background: #161924;
          border: 1px solid #252a40;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .group-heading { display: flex; flex-direction: column; gap: 3px; }
        .group-title {
          font-size: 11px;
          font-weight: 700;
          color: #81b29a;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          margin: 0;
        }
        .group-desc { font-size: 12px; color: #5a6080; margin: 0; }

        .fields-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .fields-grid.compact {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label {
          font-size: 12px;
          color: #b0b8cc;
          font-weight: 500;
        }

        /* ── INPUT WRAPPER ── */
        .input-wrap {
          display: flex;
          align-items: stretch;
          background: #252b42;
          border: 1.5px solid #5060a0;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-wrap:focus-within {
          border-color: #81b29a;
          box-shadow: 0 0 0 3px rgba(129, 178, 154, 0.18);
        }
        .prefix {
          padding: 0 10px;
          font-size: 12px;
          font-weight: 600;
          color: #a0a8c0;
          white-space: nowrap;
          background: #1e2340;
          display: flex;
          align-items: center;
          user-select: none;
          border-right: 1.5px solid #5060a0;
          flex-shrink: 0;
        }
        .field-input {
          flex: 1;
          min-width: 0;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: #e8e3d9;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          outline: none;
        }
        .field-input::placeholder { color: #606888; }
        .field-hint { font-size: 11px; color: #4a5068; margin: 0; }

        .section-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #1a1f30;
          border-radius: 8px;
          font-size: 12px;
          color: #8a9080;
        }
        .section-total-value {
          font-weight: 700;
          color: #e8e3d9;
          font-size: 14px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 600px) {
          .calc-header { flex-direction: column; align-items: stretch; gap: 12px; }
          .save-btn { width: 100%; text-align: center; padding: 12px; }
          .section-title { font-size: 18px; }
          .input-group { padding: 16px; }
          .fields-grid,
          .fields-grid.compact {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 400px) {
          .fields-grid,
          .fields-grid.compact {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
