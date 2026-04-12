"use client";

import { useState } from "react";
import DatePicker from "./DatePicker";

export interface Booking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  source: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  paymentStatus: "paid" | "partial" | "unpaid";
  chargeAmount: number;
  discountAmount: number;
  amountPaid: number;
  notes: string;
  createdAt: string;
}

interface BookingTrackerProps {
  bookings: Booking[];
  onAddBooking: (b: Omit<Booking, "id" | "createdAt">) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
  accentColor?: string;
}

const SOURCES = [
  { name: "Airbnb", icon: "🏠", color: "#FF5A5F" },
  { name: "Booking.com", icon: "🔵", color: "#003580" },
  { name: "VRBO", icon: "🏡", color: "#1A8FFF" },
  { name: "Agoda", icon: "🌏", color: "#E8000B" },
  { name: "Expedia", icon: "✈️", color: "#FFC72C" },
  { name: "Direct / Walk-in", icon: "🤝", color: "#81B29A" },
  { name: "WhatsApp / Phone", icon: "📱", color: "#25D366" },
  { name: "Other", icon: "📋", color: "#8B8B8B" },
];

const BOOKING_STATUSES = [
  { value: "confirmed", label: "Confirmed", color: "#81B29A" },
  { value: "pending",   label: "Pending",   color: "#F2CC8F" },
  { value: "completed", label: "Completed", color: "#118AB2" },
  { value: "cancelled", label: "Cancelled", color: "#E07A5F" },
];

const PAYMENT_STATUSES = [
  { value: "paid",    label: "Paid in Full", color: "#81B29A" },
  { value: "partial", label: "Partial",       color: "#F2CC8F" },
  { value: "unpaid",  label: "Unpaid",        color: "#E07A5F" },
];

const sourceColor = (name: string) =>
  SOURCES.find((s) => s.name === name)?.color ?? "#8B8B8B";
const sourceIcon = (name: string) =>
  SOURCES.find((s) => s.name === name)?.icon ?? "📋";
const statusMeta = (v: string) =>
  BOOKING_STATUSES.find((s) => s.value === v) ?? BOOKING_STATUSES[0];
const paymentMeta = (v: string) =>
  PAYMENT_STATUSES.find((s) => s.value === v) ?? PAYMENT_STATUSES[2];

function nightsBetween(from: string, to: string) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtCurrency(n: number) {
  return `KSh ${new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)}`;
}

const EMPTY_FORM: Omit<Booking, "id" | "createdAt"> = {
  guestName: "",
  checkIn: new Date().toISOString().split("T")[0],
  checkOut: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })(),
  nights: 1,
  source: "Direct / Walk-in",
  status: "confirmed",
  paymentStatus: "paid",
  chargeAmount: 0,
  discountAmount: 0,
  amountPaid: 0,
  notes: "",
};

export default function BookingTracker({
  bookings,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  accentColor = "#81B29A",
}: BookingTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Booking, "id" | "createdAt">>(EMPTY_FORM);

  const updateForm = (patch: Partial<typeof form>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.checkIn || patch.checkOut) {
        next.nights = nightsBetween(next.checkIn, next.checkOut);
      }
      // Auto-fill amountPaid when charge/discount changes and payment is paid
      if ((patch.chargeAmount !== undefined || patch.discountAmount !== undefined) && next.paymentStatus === "paid") {
        next.amountPaid = Math.max(0, next.chargeAmount - next.discountAmount);
      }
      if (patch.paymentStatus === "paid") {
        next.amountPaid = Math.max(0, next.chargeAmount - next.discountAmount);
      }
      if (patch.paymentStatus === "unpaid") {
        next.amountPaid = 0;
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.guestName.trim() || form.chargeAmount <= 0) return;
    onAddBooking({ ...form, nights: nightsBetween(form.checkIn, form.checkOut) });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalRevenue = bookings.filter((b) => b.paymentStatus !== "unpaid" && b.status !== "cancelled")
    .reduce((s, b) => s + b.amountPaid, 0);
  const pendingRevenue = bookings.filter((b) => b.paymentStatus !== "paid" && b.status !== "cancelled")
    .reduce((s, b) => s + (b.chargeAmount - b.discountAmount - b.amountPaid), 0);
  const activeBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length;
  const avgPerBooking = bookings.length > 0
    ? bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.amountPaid, 0) /
      Math.max(1, bookings.filter((b) => b.status !== "cancelled").length)
    : 0;

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filtered = bookings
    .filter((b) => filterSource === "All" || b.source === filterSource)
    .filter((b) => filterPayment === "All" || b.paymentStatus === filterPayment)
    .filter((b) => filterStatus === "All" || b.status === filterStatus)
    .sort((a, b) =>
      sortBy === "date"
        ? new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
        : b.amountPaid - a.amountPaid
    );

  const usedSources = [...new Set(bookings.map((b) => b.source))];

  return (
    <div className="bk-root">
      {/* ── Header ── */}
      <div className="bk-header">
        <div>
          <h2 className="bk-title">Bookings</h2>
          <p className="bk-desc">Track every booking, its source, payment and notes in one place.</p>
        </div>
        <button className="bk-btn-add" onClick={() => { setShowForm(true); setExpandedId(null); }}>
          + Add Booking
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="bk-stats">
        <div className="bk-stat">
          <span className="bk-stat-label">Total Bookings</span>
          <span className="bk-stat-value">{bookings.length}</span>
        </div>
        <div className="bk-stat">
          <span className="bk-stat-label">Revenue Collected</span>
          <span className="bk-stat-value bk-green">{fmtCurrency(totalRevenue)}</span>
        </div>
        <div className="bk-stat">
          <span className="bk-stat-label">Pending Payment</span>
          <span className="bk-stat-value bk-amber">{fmtCurrency(pendingRevenue)}</span>
        </div>
        <div className="bk-stat">
          <span className="bk-stat-label">Active</span>
          <span className="bk-stat-value">{activeBookings}</span>
        </div>
        <div className="bk-stat">
          <span className="bk-stat-label">Avg / Booking</span>
          <span className="bk-stat-value">{fmtCurrency(avgPerBooking)}</span>
        </div>
      </div>

      {/* ── Add Booking Form ── */}
      {showForm && (
        <div className="bk-form-card">
          <div className="bk-form-header">
            <h3 className="bk-form-title">New Booking</h3>
            <button className="bk-form-close" onClick={() => setShowForm(false)}>✕</button>
          </div>

          <div className="bk-form-grid">
            {/* Guest name */}
            <div className="bk-fg bk-fg-full">
              <label className="bk-label">Guest Name *</label>
              <input
                className="bk-input"
                placeholder="e.g. John Kamau"
                value={form.guestName}
                onChange={(e) => updateForm({ guestName: e.target.value })}
              />
            </div>

            {/* Dates */}
            <div className="bk-fg">
              <label className="bk-label">Check-in</label>
              <DatePicker
                value={form.checkIn}
                max={form.checkOut || undefined}
                rangeEnd={form.checkOut}
                placeholder="Select check-in"
                onChange={(v) => updateForm({ checkIn: v })}
              />
            </div>
            <div className="bk-fg">
              <label className="bk-label">Check-out</label>
              <DatePicker
                value={form.checkOut}
                min={form.checkIn || undefined}
                rangeEnd={form.checkIn}
                placeholder="Select check-out"
                onChange={(v) => updateForm({ checkOut: v })}
              />
            </div>

            {/* Nights display */}
            <div className="bk-fg bk-fg-full">
              <div className="bk-nights-badge">
                🌙 {nightsBetween(form.checkIn, form.checkOut)} night{nightsBetween(form.checkIn, form.checkOut) !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Source */}
            <div className="bk-fg bk-fg-full">
              <label className="bk-label">Booking Source</label>
              <div className="bk-source-grid">
                {SOURCES.map((s) => (
                  <button
                    key={s.name}
                    className={`bk-source-btn ${form.source === s.name ? "active" : ""}`}
                    style={form.source === s.name ? { borderColor: s.color, background: `${s.color}18`, color: s.color } : {}}
                    onClick={() => updateForm({ source: s.name })}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="bk-fg">
              <label className="bk-label">Booking Status</label>
              <div className="bk-toggle-row">
                {BOOKING_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    className={`bk-toggle ${form.status === s.value ? "active" : ""}`}
                    style={form.status === s.value ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}}
                    onClick={() => updateForm({ status: s.value as Booking["status"] })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment status */}
            <div className="bk-fg">
              <label className="bk-label">Payment Status</label>
              <div className="bk-toggle-row">
                {PAYMENT_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    className={`bk-toggle ${form.paymentStatus === s.value ? "active" : ""}`}
                    style={form.paymentStatus === s.value ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}}
                    onClick={() => updateForm({ paymentStatus: s.value as Booking["paymentStatus"] })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amounts */}
            <div className="bk-fg">
              <label className="bk-label">Charge Amount (KSh) *</label>
              <input
                type="number"
                min="0"
                className="bk-input"
                placeholder="0"
                value={form.chargeAmount || ""}
                onChange={(e) => updateForm({ chargeAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="bk-fg">
              <label className="bk-label">Discount Given (KSh)</label>
              <input
                type="number"
                min="0"
                className="bk-input"
                placeholder="0"
                value={form.discountAmount || ""}
                onChange={(e) => updateForm({ discountAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="bk-fg bk-fg-full">
              <label className="bk-label">
                Amount Paid (KSh)
                {form.paymentStatus === "paid" && <span className="bk-label-hint"> — auto-calculated</span>}
              </label>
              <input
                type="number"
                min="0"
                className="bk-input"
                placeholder="0"
                value={form.amountPaid || ""}
                onChange={(e) => updateForm({ amountPaid: parseFloat(e.target.value) || 0 })}
              />
              {form.chargeAmount > 0 && (
                <div className="bk-amount-summary">
                  <span>Net: <strong>{fmtCurrency(form.chargeAmount - form.discountAmount)}</strong></span>
                  {form.discountAmount > 0 && (
                    <span className="bk-discount-tag">
                      {((form.discountAmount / form.chargeAmount) * 100).toFixed(0)}% discount
                    </span>
                  )}
                  {form.paymentStatus === "partial" && form.amountPaid > 0 && (
                    <span className="bk-pending-tag">
                      {fmtCurrency(form.chargeAmount - form.discountAmount - form.amountPaid)} outstanding
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bk-fg bk-fg-full">
              <label className="bk-label">Notes</label>
              <textarea
                className="bk-textarea"
                placeholder="Any details about this booking — special requests, arrival time, guest preferences…"
                value={form.notes}
                rows={3}
                onChange={(e) => updateForm({ notes: e.target.value })}
              />
            </div>
          </div>

          <div className="bk-form-actions">
            <button className="bk-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            <button
              className="bk-btn-save"
              style={{ background: accentColor }}
              onClick={handleSubmit}
              disabled={!form.guestName.trim() || form.chargeAmount <= 0}
            >
              Save Booking
            </button>
          </div>
        </div>
      )}

      {/* ── Filters + Sort ── */}
      {bookings.length > 0 && (
        <div className="bk-filters">
          <div className="bk-filter-chips">
            {/* Source filter */}
            {usedSources.length > 1 && (
              <>
                <button
                  className={`bk-chip ${filterSource === "All" ? "active" : ""}`}
                  onClick={() => setFilterSource("All")}
                >
                  All sources
                </button>
                {usedSources.map((src) => (
                  <button
                    key={src}
                    className={`bk-chip ${filterSource === src ? "active" : ""}`}
                    style={filterSource === src ? { borderColor: sourceColor(src), color: sourceColor(src) } : {}}
                    onClick={() => setFilterSource(src)}
                  >
                    {sourceIcon(src)} {src}
                  </button>
                ))}
                <span className="bk-chip-sep">|</span>
              </>
            )}
            {/* Payment filter */}
            {(["All", "paid", "partial", "unpaid"] as const).map((p) => (
              <button
                key={p}
                className={`bk-chip ${filterPayment === p ? "active" : ""}`}
                style={filterPayment === p && p !== "All" ? { borderColor: paymentMeta(p).color, color: paymentMeta(p).color } : {}}
                onClick={() => setFilterPayment(p)}
              >
                {p === "All" ? "All payments" : paymentMeta(p).label}
              </button>
            ))}
          </div>
          <select
            className="bk-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
          >
            <option value="date">Sort: Check-in Date</option>
            <option value="amount">Sort: Amount</option>
          </select>
        </div>
      )}

      {/* ── Booking List ── */}
      <div className="bk-list">
        {filtered.length === 0 ? (
          <div className="bk-empty">
            <span>📋</span>
            <p>No bookings recorded yet. Add your first booking to start tracking revenue.</p>
          </div>
        ) : (
          filtered.map((b) => {
            const src = SOURCES.find((s) => s.name === b.source);
            const sts = statusMeta(b.status);
            const pmt = paymentMeta(b.paymentStatus);
            const net = b.chargeAmount - b.discountAmount;
            const outstanding = net - b.amountPaid;
            const isExpanded = expandedId === b.id;

            return (
              <div key={b.id} className={`bk-card ${b.status === "cancelled" ? "bk-card-cancelled" : ""}`}>
                {/* Card top row */}
                <div className="bk-card-top">
                  <div className="bk-card-left">
                    {/* Source badge */}
                    <span
                      className="bk-source-badge"
                      style={{ background: `${src?.color ?? "#8B8B8B"}1A`, color: src?.color ?? "#8B8B8B", borderColor: `${src?.color ?? "#8B8B8B"}44` }}
                    >
                      {src?.icon} {b.source}
                    </span>
                    {/* Status badge */}
                    <span
                      className="bk-status-badge"
                      style={{ background: `${sts.color}1A`, color: sts.color, borderColor: `${sts.color}44` }}
                    >
                      {sts.label}
                    </span>
                    {/* Payment badge */}
                    <span
                      className="bk-status-badge"
                      style={{ background: `${pmt.color}1A`, color: pmt.color, borderColor: `${pmt.color}44` }}
                    >
                      {pmt.label}
                    </span>
                  </div>
                  <div className="bk-card-actions">
                    {b.paymentStatus !== "paid" && b.status !== "cancelled" && (
                      <button
                        className="bk-action-btn bk-mark-paid"
                        onClick={() => onUpdateBooking(b.id, { paymentStatus: "paid", amountPaid: net })}
                      >
                        ✓ Mark Paid
                      </button>
                    )}
                    <button
                      className="bk-action-btn"
                      onClick={() => setExpandedId(isExpanded ? null : b.id)}
                    >
                      {isExpanded ? "Hide" : "Details"}
                    </button>
                    {deleteConfirm === b.id ? (
                      <>
                        <button className="bk-action-btn bk-delete-confirm" onClick={() => { onDeleteBooking(b.id); setDeleteConfirm(null); }}>
                          Confirm
                        </button>
                        <button className="bk-action-btn" onClick={() => setDeleteConfirm(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="bk-action-btn bk-delete-btn" onClick={() => setDeleteConfirm(b.id)}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Guest + dates */}
                <div className="bk-card-main">
                  <div className="bk-card-guest">{b.guestName}</div>
                  <div className="bk-card-dates">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    <span className="bk-nights-pill">🌙 {b.nights} night{b.nights !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Amounts */}
                <div className="bk-card-amounts">
                  <div className="bk-amount-item">
                    <span className="bk-amount-label">Charged</span>
                    <span className="bk-amount-val">{fmtCurrency(b.chargeAmount)}</span>
                  </div>
                  {b.discountAmount > 0 && (
                    <div className="bk-amount-item">
                      <span className="bk-amount-label">Discount</span>
                      <span className="bk-amount-val bk-red">− {fmtCurrency(b.discountAmount)}</span>
                    </div>
                  )}
                  <div className="bk-amount-item">
                    <span className="bk-amount-label">Net</span>
                    <span className="bk-amount-val">{fmtCurrency(net)}</span>
                  </div>
                  <div className="bk-amount-item bk-amount-item-highlight">
                    <span className="bk-amount-label">Paid</span>
                    <span className="bk-amount-val bk-green">{fmtCurrency(b.amountPaid)}</span>
                  </div>
                  {outstanding > 0 && b.status !== "cancelled" && (
                    <div className="bk-amount-item">
                      <span className="bk-amount-label">Outstanding</span>
                      <span className="bk-amount-val bk-amber">{fmtCurrency(outstanding)}</span>
                    </div>
                  )}
                </div>

                {/* Expanded details + notes */}
                {isExpanded && (
                  <div className="bk-card-expanded">
                    {b.discountAmount > 0 && (
                      <div className="bk-detail-row">
                        <span className="bk-detail-label">Discount %</span>
                        <span className="bk-detail-val">
                          {((b.discountAmount / b.chargeAmount) * 100).toFixed(1)}% off
                        </span>
                      </div>
                    )}
                    <div className="bk-detail-row">
                      <span className="bk-detail-label">Rate / Night</span>
                      <span className="bk-detail-val">{fmtCurrency(b.chargeAmount / Math.max(1, b.nights))}</span>
                    </div>
                    {b.notes ? (
                      <div className="bk-notes-block">
                        <span className="bk-notes-label">📝 Notes</span>
                        <p className="bk-notes-text">{b.notes}</p>
                      </div>
                    ) : (
                      <div className="bk-notes-empty">No notes for this booking.</div>
                    )}
                    {/* Inline status update */}
                    <div className="bk-inline-actions">
                      <span className="bk-inline-label">Update Status:</span>
                      {BOOKING_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          className={`bk-toggle bk-toggle-sm ${b.status === s.value ? "active" : ""}`}
                          style={b.status === s.value ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}}
                          onClick={() => onUpdateBooking(b.id, { status: s.value as Booking["status"] })}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .bk-root { display: flex; flex-direction: column; gap: 20px; font-family: 'DM Sans', sans-serif; min-width: 0; max-width: 100%; overflow-x: hidden; }

        /* Header */
        .bk-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .bk-title { font-size: 22px; font-weight: 700; color: #e8e3d9; margin: 0 0 5px; }
        .bk-desc { font-size: 13px; color: #5a6080; margin: 0; }
        .bk-btn-add {
          padding: 10px 20px;
          background: #81B29A;
          border: none;
          border-radius: 8px;
          color: #0f1117;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .bk-btn-add:hover { background: #6fa085; }

        /* Stats */
        .bk-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        .bk-stat {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .bk-stat-label { font-size: 10px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; }
        .bk-stat-value { font-size: 18px; font-weight: 800; color: #e8e3d9; overflow-wrap: anywhere; word-break: break-word; }
        .bk-green { color: #81B29A; }
        .bk-amber { color: #F2CC8F; }
        .bk-red   { color: #E07A5F; }

        /* Form card */
        .bk-form-card {
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .bk-form-header { display: flex; justify-content: space-between; align-items: center; }
        .bk-form-title { font-size: 16px; font-weight: 700; color: #e8e3d9; margin: 0; }
        .bk-form-close {
          background: none;
          border: none;
          color: #5a6080;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.15s;
        }
        .bk-form-close:hover { color: #e07a5f; }

        .bk-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .bk-fg { display: flex; flex-direction: column; gap: 6px; }
        .bk-fg-full { grid-column: 1 / -1; }

        .bk-label {
          font-size: 12px;
          font-weight: 500;
          color: #b0b8cc;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }
        .bk-label-hint { text-transform: none; letter-spacing: 0; color: #4a5068; font-weight: 400; }
        .bk-input {
          padding: 10px 12px;
          background: #1c2138;
          border: 1.5px solid #3a4060;
          border-radius: 8px;
          color: #e8e3d9;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .bk-input:focus {
          border-color: #81b29a;
          box-shadow: 0 0 0 3px rgba(129,178,154,0.15);
        }
        .bk-textarea {
          padding: 10px 12px;
          background: #1c2138;
          border: 1.5px solid #3a4060;
          border-radius: 8px;
          color: #e8e3d9;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.15s;
          line-height: 1.6;
        }
        .bk-textarea:focus { border-color: #81b29a; }
        .bk-textarea::placeholder { color: #4a5068; }

        .bk-nights-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #111520;
          border: 1px solid #2a3050;
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 13px;
          color: #c8c3b8;
          width: fit-content;
        }

        .bk-source-grid { display: flex; flex-wrap: wrap; gap: 7px; }
        .bk-source-btn {
          padding: 6px 12px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 7px;
          color: #5a6080;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .bk-source-btn:hover { border-color: #4a5068; color: #c8c3b8; }
        .bk-source-btn.active { font-weight: 600; }

        .bk-toggle-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .bk-toggle {
          padding: 6px 12px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 20px;
          color: #5a6080;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .bk-toggle:hover { border-color: #4a5068; color: #c8c3b8; }
        .bk-toggle.active { font-weight: 600; }
        .bk-toggle-sm { font-size: 11px; padding: 4px 10px; }

        .bk-amount-summary {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #8a9080;
          margin-top: 2px;
        }
        .bk-amount-summary strong { color: #e8e3d9; }
        .bk-discount-tag {
          background: #1a1f10;
          border: 1px solid #81b29a33;
          color: #81b29a;
          border-radius: 4px;
          padding: 1px 8px;
        }
        .bk-pending-tag {
          background: #1a1a0f;
          border: 1px solid #f2cc8f33;
          color: #f2cc8f;
          border-radius: 4px;
          padding: 1px 8px;
        }

        .bk-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 4px;
          border-top: 1px solid #1e2130;
        }
        .bk-btn-cancel {
          padding: 10px 20px;
          background: none;
          border: 1px solid #2a3050;
          border-radius: 8px;
          color: #5a6080;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .bk-btn-cancel:hover { border-color: #5a6080; color: #c8c3b8; }
        .bk-btn-save {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          color: #0f1117;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.15s;
        }
        .bk-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Filters */
        .bk-filters { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .bk-filter-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .bk-chip {
          padding: 5px 12px;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 20px;
          color: #5a6080;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .bk-chip:hover { border-color: #4a5068; color: #c8c3b8; }
        .bk-chip.active { border-color: #81B29A; color: #81B29A; background: #0f1a14; font-weight: 600; }
        .bk-chip-sep { color: #2a3050; font-size: 16px; padding: 0 2px; }
        .bk-sort-select {
          padding: 7px 12px;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 7px;
          color: #5a6080;
          font-size: 12px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* Booking cards */
        .bk-list { display: flex; flex-direction: column; gap: 8px; }
        .bk-empty {
          background: #161924;
          border: 1px dashed #2a3050;
          border-radius: 12px;
          padding: 40px 24px;
          text-align: center;
          color: #4a5068;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }
        .bk-empty span { font-size: 32px; }

        .bk-card {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.15s;
        }
        .bk-card:hover { border-color: #2a3050; }
        .bk-card-cancelled { opacity: 0.55; }

        .bk-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
        .bk-card-left { display: flex; gap: 7px; flex-wrap: wrap; align-items: center; }

        .bk-source-badge, .bk-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }

        .bk-card-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .bk-action-btn {
          padding: 5px 12px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 6px;
          color: #5a6080;
          font-size: 11px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .bk-action-btn:hover { border-color: #4a5068; color: #c8c3b8; }
        .bk-mark-paid { border-color: #81b29a44; color: #81b29a; }
        .bk-mark-paid:hover { background: #0f1a14; border-color: #81b29a; }
        .bk-delete-btn:hover { border-color: #e07a5f44; color: #e07a5f; }
        .bk-delete-confirm { border-color: #e07a5f; color: #e07a5f; background: #1a100f; }

        .bk-card-main { display: flex; flex-direction: column; gap: 4px; }
        .bk-card-guest { font-size: 16px; font-weight: 700; color: #e8e3d9; }
        .bk-card-dates { font-size: 13px; color: #5a6080; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .bk-nights-pill {
          background: #111520;
          border: 1px solid #2a3050;
          border-radius: 12px;
          padding: 2px 10px;
          font-size: 11px;
          color: #8a9080;
        }

        .bk-card-amounts {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          padding: 10px 14px;
          background: #111520;
          border-radius: 8px;
          border: 1px solid #1e2130;
        }
        .bk-amount-item { display: flex; flex-direction: column; gap: 2px; }
        .bk-amount-item-highlight { padding-left: 20px; border-left: 2px solid #2a3050; }
        .bk-amount-label { font-size: 10px; color: #4a5068; text-transform: uppercase; letter-spacing: 0.7px; }
        .bk-amount-val { font-size: 14px; font-weight: 700; color: #e8e3d9; }

        .bk-card-expanded {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid #1e2130;
        }
        .bk-detail-row { display: flex; justify-content: space-between; font-size: 13px; }
        .bk-detail-label { color: #5a6080; }
        .bk-detail-val { color: #c8c3b8; font-weight: 500; }

        .bk-notes-block {
          background: #111520;
          border: 1px solid #2a3050;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .bk-notes-label { font-size: 11px; font-weight: 600; color: #5a6080; text-transform: uppercase; letter-spacing: 0.7px; }
        .bk-notes-text { font-size: 13px; color: #c8c3b8; margin: 0; line-height: 1.7; white-space: pre-wrap; }
        .bk-notes-empty { font-size: 12px; color: #4a5068; font-style: italic; }

        .bk-inline-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .bk-inline-label { font-size: 11px; color: #4a5068; text-transform: uppercase; letter-spacing: 0.7px; }

        /* Responsive */
        @media (max-width: 800px) {
          .bk-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .bk-header { flex-direction: column; align-items: stretch; }
          .bk-btn-add { width: 100%; text-align: center; padding: 12px; }
          .bk-stats { grid-template-columns: 1fr 1fr; }
          .bk-stat-value { font-size: 15px; }
          .bk-form-grid { grid-template-columns: 1fr; }
          .bk-fg-full { grid-column: 1; }
          .bk-form-card { padding: 16px; }
          .bk-form-actions { flex-direction: column-reverse; }
          .bk-btn-cancel, .bk-btn-save { width: 100%; text-align: center; }
          .bk-card-amounts { gap: 10px; padding: 10px 10px; }
          .bk-amount-val { font-size: 13px; }
          .bk-filters { flex-direction: column; align-items: stretch; }
          .bk-sort-select { width: 100%; }
          .bk-title { font-size: 18px; }
          .bk-card { padding: 12px; }
          .bk-card-guest { font-size: 14px; }
          .bk-amount-item-highlight { padding-left: 10px; }
        }
        @media (max-width: 400px) {
          .bk-stats { grid-template-columns: 1fr; }
          .bk-stat { padding: 10px 12px; }
          .bk-stat-value { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
