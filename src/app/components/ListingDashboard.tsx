"use client";

import { useState, useEffect } from "react";
import CalendarSync, { CalendarSource } from "./CalendarSync";
import FinancialCalculator, { FinancialData } from "./FinancialCalculator";
import ExpenseTracker, { Expense } from "./ExpenseTracker";
import { Listing } from "./ListingsSidebar";

/** Safely read a JSON value from localStorage, returning fallback on any error. */
function fromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface ListingDashboardProps {
  listing: Listing;
  onOpenSidebar?: () => void;
  onUpdateListing?: (updates: Partial<Omit<Listing, "id">>) => void;
  onDeleteListing?: () => void;
}

function formatCurrency(value: number) {
  return `KSh ${new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}

const DEFAULT_FINANCIAL_DATA: FinancialData = {
  furnitureCost: 0,
  transportCost: 0,
  installationCost: 0,
  setupUtilitiesCost: 0,
  miscellaneousCost: 0,
  rentDepositCost: 0,
  chargePerStay: 0,
  projectedStaysPerMonth: 0,
  discountPercent: 0,
  monthlyRent: 0,
  monthlyUtilities: 0,
  monthlyCleaner: 0,
};

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "financials", label: "Financials", icon: "💰" },
  { id: "summary", label: "Summary", icon: "📈" },
  { id: "expenses", label: "Expenses", icon: "🧾" },
  { id: "calendar", label: "Calendar Sync", icon: "📅" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

const LISTING_COLORS = [
  "#E07A5F", "#3D405B", "#81B29A", "#F2CC8F",
  "#118AB2", "#06D6A0", "#EF476F", "#FFD166",
];

const LISTING_TYPES = [
  "Apartment", "House", "Villa", "Studio",
  "Cottage", "Cabin", "Condo", "Room",
];

export default function ListingDashboard({
  listing,
  onOpenSidebar,
  onUpdateListing,
  onDeleteListing,
}: ListingDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // ── Per-listing persisted state ──
  const [financialData, setFinancialData] = useState<FinancialData>(() =>
    fromStorage(`bnb_fin_${listing.id}`, DEFAULT_FINANCIAL_DATA)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    fromStorage(`bnb_exp_${listing.id}`, [])
  );
  const [calendarSources, setCalendarSources] = useState<CalendarSource[]>(() =>
    fromStorage(`bnb_cal_${listing.id}`, [])
  );

  // Persist whenever data changes
  useEffect(() => {
    localStorage.setItem(`bnb_fin_${listing.id}`, JSON.stringify(financialData));
  }, [financialData, listing.id]);

  useEffect(() => {
    localStorage.setItem(`bnb_exp_${listing.id}`, JSON.stringify(expenses));
  }, [expenses, listing.id]);

  useEffect(() => {
    localStorage.setItem(`bnb_cal_${listing.id}`, JSON.stringify(calendarSources));
  }, [calendarSources, listing.id]);

  // Settings form state — kept in sync with the listing prop
  const [settingsForm, setSettingsForm] = useState({
    name: listing.name,
    address: listing.address,
    type: listing.type,
    color: listing.color,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSettingsSave = () => {
    if (!settingsForm.name.trim()) return;
    onUpdateListing?.(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const addCalendarSource = (source: Omit<CalendarSource, "id" | "lastSynced" | "status">) => {
    setCalendarSources((prev) => [
      ...prev,
      { ...source, id: Date.now().toString(), lastSynced: null, status: "pending" },
    ]);
  };

  const removeCalendarSource = (id: string) => {
    setCalendarSources((prev) => prev.filter((s) => s.id !== id));
  };

  const syncCalendarSource = (id: string) => {
    setCalendarSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "synced", lastSynced: "just now" }
          : s
      )
    );
  };

  const addExpense = (expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [...prev, { ...expense, id: Date.now().toString() }]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSetupCost =
    financialData.furnitureCost +
    financialData.transportCost +
    financialData.installationCost +
    financialData.setupUtilitiesCost +
    financialData.miscellaneousCost +
    financialData.rentDepositCost;
  const effectiveRate =
    financialData.chargePerStay * (1 - financialData.discountPercent / 100);
  const projectedSales = effectiveRate * financialData.projectedStaysPerMonth;
  const monthlyOperatingExpenses =
    financialData.monthlyRent +
    financialData.monthlyUtilities +
    financialData.monthlyCleaner;
  const monthlyProfit = projectedSales - monthlyOperatingExpenses;
  const daysToBreakEven =
    monthlyProfit > 0 ? Math.ceil((totalSetupCost / monthlyProfit) * 30) : null;

  return (
    <div className="listing-dashboard">
      {/* Listing Header */}
      <div className="listing-header">
        {/* Hamburger — mobile only */}
        {onOpenSidebar && (
          <button className="header-menu-btn" onClick={onOpenSidebar} aria-label="Open navigation">
            <span /><span /><span />
          </button>
        )}
        <div className="listing-color-bar" style={{ background: listing.color }} />
        <div className="listing-header-info">
          <div className="listing-name-row">
            <h1 className="listing-name">{listing.name}</h1>
            <span className="listing-type-badge">{listing.type}</span>
          </div>
          {listing.address && <p className="listing-address">📍 {listing.address}</p>}
        </div>
        <div className="listing-quick-stats">
          <div className="quick-stat">
            <span className="qs-value">{calendarSources.length}</span>
            <span className="qs-label">Channels</span>
          </div>
          <div className="quick-stat">
            <span className="qs-value">{expenses.length}</span>
            <span className="qs-label">Expenses</span>
          </div>
          <div className="quick-stat">
            <span className="qs-value">{formatCurrency(totalSetupCost)}</span>
            <span className="qs-label">Setup Budget</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
            style={activeTab === tab.id ? { borderBottomColor: listing.color } : {}}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-grid">
            <div className="overview-card highlight" style={{ borderColor: `${listing.color}44` }}>
              <span className="ov-icon">🏠</span>
              <div>
                <div className="ov-title">Property</div>
                <div className="ov-value">{listing.name}</div>
                <div className="ov-sub">{listing.type} · {listing.address || "No address set"}</div>
              </div>
            </div>
            <div className="overview-card">
              <span className="ov-icon">💰</span>
              <div>
                <div className="ov-title">Total Setup Budget</div>
                <div className="ov-value">{formatCurrency(totalSetupCost)}</div>
                <div className="ov-sub">All finance inputs combined</div>
              </div>
            </div>
            <div className="overview-card">
              <span className="ov-icon">🛏️</span>
              <div>
                <div className="ov-title">Price Per Stay</div>
                <div className="ov-value">{formatCurrency(financialData.chargePerStay)}</div>
                <div className="ov-sub">
                  {financialData.discountPercent > 0
                    ? `Net after ${financialData.discountPercent}% fee: ${formatCurrency(effectiveRate)}`
                    : "Per booking"}
                </div>
              </div>
            </div>
            <div className="overview-card">
              <span className="ov-icon">📈</span>
              <div>
                <div className="ov-title">Projected Monthly Sales</div>
                <div className="ov-value" style={{ color: "#81B29A" }}>
                  {formatCurrency(projectedSales)}
                </div>
                <div className="ov-sub">{financialData.projectedStaysPerMonth} stays expected</div>
              </div>
            </div>
            <div className="overview-card">
              <span className="ov-icon">💸</span>
              <div>
                <div className="ov-title">Monthly Profit</div>
                <div
                  className="ov-value"
                  style={{ color: monthlyProfit >= 0 ? "#81B29A" : "#E07A5F" }}
                >
                  {formatCurrency(monthlyProfit)}
                </div>
                <div className="ov-sub">
                  Sales {formatCurrency(projectedSales)} − exp {formatCurrency(monthlyOperatingExpenses)}
                </div>
              </div>
            </div>
            <div className="overview-card">
              <span className="ov-icon">📅</span>
              <div>
                <div className="ov-title">Days to Break Even</div>
                <div className="ov-value" style={{ color: daysToBreakEven ? "#F2CC8F" : "#E07A5F" }}>
                  {daysToBreakEven ? daysToBreakEven.toLocaleString() : "—"}
                </div>
                <div className="ov-sub">
                  {daysToBreakEven
                    ? `To recover ${formatCurrency(totalSetupCost)} invested`
                    : "Set your financial numbers first"}
                </div>
              </div>
            </div>
            <div className="overview-card">
              <span className="ov-icon">🧾</span>
              <div>
                <div className="ov-title">Total Logged Expenses</div>
                <div className="ov-value" style={{ color: "#E07A5F" }}>{formatCurrency(totalExpenses)}</div>
                <div className="ov-sub">{expenses.length} transactions</div>
              </div>
            </div>
            <div className="overview-card">
              <span className="ov-icon">🔗</span>
              <div>
                <div className="ov-title">Calendar Channels</div>
                <div className="ov-value">{calendarSources.length}</div>
                <div className="ov-sub">
                  {calendarSources.filter((c) => c.status === "synced").length} synced
                </div>
              </div>
            </div>

            <div className="overview-cta-row">
              <button className="cta-card" onClick={() => setActiveTab("financials")}>
                <span>💰</span>
                <div>
                  <div className="cta-title">Set Up Financials</div>
                  <div className="cta-desc">Enter your setup costs and see your total budget instantly</div>
                </div>
                <span className="cta-arrow">→</span>
              </button>
              <button className="cta-card" onClick={() => setActiveTab("calendar")}>
                <span>📅</span>
                <div>
                  <div className="cta-title">Sync Calendars</div>
                  <div className="cta-desc">Connect Airbnb, Booking.com, VRBO and more</div>
                </div>
                <span className="cta-arrow">→</span>
              </button>
              <button className="cta-card" onClick={() => setActiveTab("expenses")}>
                <span>🧾</span>
                <div>
                  <div className="cta-title">Track Expenses</div>
                  <div className="cta-desc">Log costs to see where your money is going</div>
                </div>
                <span className="cta-arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <FinancialCalculator data={financialData} onChange={setFinancialData} />
        )}

        {activeTab === "summary" && (
          <div className="summary-section">
            <div className="sum-header">
              <div>
                <h2 className="sum-title">Financial Summary</h2>
                <p className="sum-desc">
                  Project your sales and see your full profit &amp; loss in one place.
                </p>
              </div>
            </div>

            <div className="sum-layout">
              {/* ── LEFT: Projected Sales Inputs ── */}
              <section className="proj-panel">
                <div className="proj-heading">
                  <h3 className="proj-title">Projected Sales</h3>
                  <p className="proj-desc">How much per stay, how many stays, and any platform deductions.</p>
                </div>

                <div className="proj-fields">
                  <div className="proj-field">
                    <label className="proj-label">Price Per Stay</label>
                    <div className="proj-input-wrap">
                      <span className="proj-prefix">KSh</span>
                      <input
                        type="number"
                        min="0"
                        className="proj-input"
                        value={financialData.chargePerStay || ""}
                        placeholder="0"
                        onChange={(e) =>
                          setFinancialData((prev) => ({
                            ...prev,
                            chargePerStay: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <p className="proj-hint">Amount the guest pays per booking</p>
                  </div>

                  <div className="proj-field">
                    <label className="proj-label">Stays Per Month</label>
                    <div className="proj-input-wrap">
                      <input
                        type="number"
                        min="0"
                        className="proj-input proj-input-bare"
                        value={financialData.projectedStaysPerMonth || ""}
                        placeholder="0"
                        onChange={(e) =>
                          setFinancialData((prev) => ({
                            ...prev,
                            projectedStaysPerMonth: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <p className="proj-hint">Expected bookings each month</p>
                  </div>

                  <div className="proj-field">
                    <label className="proj-label">Discount / Platform Fee</label>
                    <div className="proj-input-wrap">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="proj-input proj-input-bare"
                        value={financialData.discountPercent || ""}
                        placeholder="0"
                        onChange={(e) =>
                          setFinancialData((prev) => ({
                            ...prev,
                            discountPercent: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <span className="proj-suffix">%</span>
                    </div>
                    <p className="proj-hint">e.g. Airbnb takes 3%</p>
                  </div>
                </div>

                {financialData.discountPercent > 0 && (
                  <div className="proj-discount-note">
                    Effective rate after {financialData.discountPercent}% deduction:{" "}
                    <strong>{formatCurrency(effectiveRate)}</strong> per stay
                  </div>
                )}

                {totalSetupCost === 0 && monthlyOperatingExpenses === 0 && (
                  <div className="proj-notice">
                    💡 Set your{" "}
                    <button className="proj-link" onClick={() => setActiveTab("financials")}>
                      Initial Setup Capital &amp; Monthly Expenses
                    </button>{" "}
                    first for a complete picture.
                  </div>
                )}
              </section>

              {/* ── RIGHT: Financial Summary ── */}
              <div className="fin-summary-panel">
                {/* Break-even hero */}
                <div className={`bev-hero ${daysToBreakEven ? "bev-profit" : "bev-loss"}`}>
                  <span className="bev-label">Days to Become Profitable</span>
                  <span className="bev-value">
                    {daysToBreakEven ? daysToBreakEven.toLocaleString() : "—"}
                  </span>
                  <span className="bev-sub">
                    {daysToBreakEven
                      ? `${formatCurrency(totalSetupCost)} capital ÷ ${formatCurrency(monthlyProfit)}/mo profit`
                      : "Not profitable at current rates — review expenses or pricing"}
                  </span>
                </div>

                {/* Monthly P&L */}
                <div className="pnl-card">
                  <h3 className="pnl-card-title">Monthly P&amp;L</h3>
                  <div className="pnl-row">
                    <span>Revenue ({financialData.projectedStaysPerMonth} stays)</span>
                    <span className="pos">{formatCurrency(projectedSales)}</span>
                  </div>
                  <div className="pnl-row">
                    <span>Rent</span>
                    <span className="neg">− {formatCurrency(financialData.monthlyRent)}</span>
                  </div>
                  <div className="pnl-row">
                    <span>Utilities</span>
                    <span className="neg">− {formatCurrency(financialData.monthlyUtilities)}</span>
                  </div>
                  <div className="pnl-row">
                    <span>Cleaner</span>
                    <span className="neg">− {formatCurrency(financialData.monthlyCleaner)}</span>
                  </div>
                  <div className="pnl-divider" />
                  <div className="pnl-row pnl-total">
                    <span>Net Profit</span>
                    <span style={{ color: monthlyProfit >= 0 ? "#81b29a" : "#e07a5f" }}>
                      {formatCurrency(monthlyProfit)}
                    </span>
                  </div>
                </div>

                {/* Snap cards */}
                <div className="sum-snap-grid">
                  <div className="sum-snap">
                    <span className="sum-snap-label">Annual Profit</span>
                    <span
                      className="sum-snap-value"
                      style={{ color: monthlyProfit >= 0 ? "#81b29a" : "#e07a5f" }}
                    >
                      {formatCurrency(monthlyProfit * 12)}
                    </span>
                  </div>
                  <div className="sum-snap">
                    <span className="sum-snap-label">Profit Margin</span>
                    <span
                      className="sum-snap-value"
                      style={{ color: monthlyProfit >= 0 ? "#81b29a" : "#e07a5f" }}
                    >
                      {projectedSales > 0
                        ? ((monthlyProfit / projectedSales) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </span>
                  </div>
                  <div className="sum-snap">
                    <span className="sum-snap-label">Total Capital</span>
                    <span className="sum-snap-value">{formatCurrency(totalSetupCost)}</span>
                  </div>
                  <div className="sum-snap">
                    <span className="sum-snap-label">Monthly Expenses</span>
                    <span className="sum-snap-value neg">
                      {formatCurrency(monthlyOperatingExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <ExpenseTracker
            expenses={expenses}
            onAddExpense={addExpense}
            onDeleteExpense={deleteExpense}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarSync
            listingId={listing.id}
            sources={calendarSources}
            onAddSource={addCalendarSource}
            onRemoveSource={removeCalendarSource}
            onSync={syncCalendarSource}
          />
        )}

        {activeTab === "settings" && (
          <div className="settings-section">
            <div className="settings-header">
              <div>
                <h2 className="settings-title">Property Settings</h2>
                <p className="settings-desc">Edit your property details and preferences.</p>
              </div>
              <button
                className={`stg-save-btn ${settingsSaved ? "saved" : ""}`}
                onClick={handleSettingsSave}
                disabled={!settingsForm.name.trim()}
              >
                {settingsSaved ? "✓ Saved" : "Save Changes"}
              </button>
            </div>

            {/* ── Property Details ── */}
            <div className="stg-card">
              <div className="stg-card-heading">
                <h3 className="stg-card-title">Property Details</h3>
                <p className="stg-card-desc">Update the name, address, type, and colour tag.</p>
              </div>

              <div className="stg-fields">
                {/* Name */}
                <div className="stg-field">
                  <label className="stg-label">Property Name</label>
                  <input
                    className="stg-input"
                    value={settingsForm.name}
                    placeholder="e.g. Downtown Loft"
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  {!settingsForm.name.trim() && (
                    <p className="stg-error">Name cannot be empty.</p>
                  )}
                </div>

                {/* Address */}
                <div className="stg-field">
                  <label className="stg-label">Address</label>
                  <input
                    className="stg-input"
                    value={settingsForm.address}
                    placeholder="e.g. 42 Oak Street, Nairobi"
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                </div>

                {/* Type */}
                <div className="stg-field">
                  <label className="stg-label">Property Type</label>
                  <select
                    className="stg-input stg-select"
                    value={settingsForm.type}
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    {LISTING_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Colour tag */}
                <div className="stg-field">
                  <label className="stg-label">Colour Tag</label>
                  <div className="stg-swatches">
                    {LISTING_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`stg-swatch ${settingsForm.color === c ? "selected" : ""}`}
                        style={{ background: c }}
                        onClick={() => setSettingsForm((f) => ({ ...f, color: c }))}
                        aria-label={c}
                      />
                    ))}
                  </div>
                  <div className="stg-color-preview">
                    <span
                      className="stg-color-bar"
                      style={{ background: settingsForm.color }}
                    />
                    <span className="stg-color-label">
                      Selected: <strong style={{ color: settingsForm.color }}>{settingsForm.color}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Danger Zone ── */}
            {onDeleteListing && (
              <div className="stg-card danger-card">
                <div className="stg-card-heading">
                  <h3 className="stg-card-title danger-title">Danger Zone</h3>
                  <p className="stg-card-desc">
                    Permanently remove this property and all its data. This cannot be undone.
                  </p>
                </div>

                {showDeleteConfirm ? (
                  <div className="delete-confirm">
                    <p className="delete-confirm-text">
                      Are you sure you want to delete <strong>{listing.name}</strong>? All financial data,
                      expenses and calendar links will be lost permanently.
                    </p>
                    <div className="delete-confirm-actions">
                      <button
                        className="stg-btn-cancel"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="stg-btn-delete-confirm"
                        onClick={onDeleteListing}
                      >
                        Yes, Delete Property
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="stg-btn-delete"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑 Delete This Property
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        /* ── BASE ── */
        .listing-dashboard {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── HEADER ── */
        .listing-header {
          background: #0f1117;
          border-bottom: 1px solid #1e2130;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Hamburger button inside header — hidden on desktop */
        .header-menu-btn {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 38px;
          height: 38px;
          padding: 9px 8px;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 8px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .header-menu-btn span {
          display: block;
          height: 2px;
          background: #c8c3b8;
          border-radius: 1px;
        }
        .header-menu-btn:hover { border-color: #81b29a; }
        .header-menu-btn:hover span { background: #81b29a; }
        @media (max-width: 767px) {
          .header-menu-btn { display: flex; }
        }
        .listing-color-bar {
          width: 4px;
          height: 44px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .listing-header-info { flex: 1; min-width: 0; }
        .listing-name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 3px; flex-wrap: wrap; }
        .listing-name { font-size: 20px; font-weight: 700; color: #e8e3d9; margin: 0; letter-spacing: -0.4px; }
        .listing-type-badge {
          padding: 2px 9px;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 20px;
          font-size: 10px;
          color: #5a6080;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          white-space: nowrap;
        }
        .listing-address { font-size: 12px; color: #5a6080; margin: 0; }
        .listing-quick-stats { display: flex; gap: 20px; }
        .quick-stat { text-align: center; }
        .qs-value { display: block; font-size: 15px; font-weight: 700; color: #e8e3d9; }
        .qs-label { display: block; font-size: 10px; color: #4a5068; text-transform: uppercase; letter-spacing: 0.8px; }

        /* ── TABS ── */
        .tabs-bar {
          display: flex;
          background: #0f1117;
          border-bottom: 1px solid #1e2130;
          padding: 0 16px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tabs-bar::-webkit-scrollbar { display: none; }
        .tab-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 13px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: #4a5068;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .tab-item:hover { color: #8a9080; }
        .tab-item.active { color: #e8e3d9; font-weight: 500; }

        /* ── TAB CONTENT ── */
        .tab-content {
          padding: 24px;
          flex: 1;
        }

        /* ── OVERVIEW GRID ── */
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .overview-card {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .overview-card.highlight { border-color: inherit; }
        .ov-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .ov-title { font-size: 10px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; }
        .ov-value { font-size: 16px; font-weight: 700; color: #e8e3d9; margin-bottom: 2px; word-break: break-all; }
        .ov-sub { font-size: 11px; color: #4a5068; line-height: 1.4; }

        /* ── CTA ROW ── */
        .overview-cta-row {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 6px;
        }
        .cta-card {
          background: #111520;
          border: 1px dashed #2a3050;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all 0.15s;
          font-size: 20px;
        }
        .cta-card:hover { border-color: #81B29A; background: #0f1a14; }
        .cta-title { font-size: 13px; font-weight: 600; color: #c8c3b8; margin-bottom: 2px; }
        .cta-desc { font-size: 11px; color: #4a5068; line-height: 1.4; }
        .cta-arrow { margin-left: auto; color: #2a3050; font-size: 16px; }
        .cta-card:hover .cta-arrow { color: #81B29A; }

        /* ── TABLET (≤ 900px) ── */
        @media (max-width: 900px) {
          .overview-grid { grid-template-columns: repeat(2, 1fr); }
          .overview-cta-row { grid-template-columns: repeat(2, 1fr); }
          .listing-quick-stats { display: none; }
          .tab-content { padding: 16px; }
        }

        /* ── MOBILE (≤ 600px) ── */
        @media (max-width: 600px) {
          /* Header */
          .listing-header { padding: 12px 14px; gap: 10px; flex-wrap: nowrap; }
          .listing-name { font-size: 16px; }
          .listing-type-badge { display: none; }
          .listing-address { font-size: 11px; }

          /* Tabs — icons only, text hidden to fit 5 tabs */
          .tab-item { padding: 10px 12px; font-size: 0; gap: 0; }
          .tab-item span:first-child { font-size: 18px; }
          .tab-item span:last-child { display: none; }
          .tab-item.active span:last-child { display: none; }

          /* Tab content */
          .tab-content { padding: 12px; }

          /* Overview grid */
          .overview-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .overview-cta-row { grid-template-columns: 1fr; }
          .overview-card { padding: 12px; gap: 10px; }
          .ov-icon { font-size: 17px; }
          .ov-value { font-size: 14px; word-break: break-word; }
          .ov-sub { font-size: 10px; }
          .cta-card { padding: 12px; font-size: 17px; }
          .cta-title { font-size: 12px; }
          .cta-desc { font-size: 10px; }
        }

        @media (max-width: 380px) {
          .overview-grid { grid-template-columns: 1fr; }
          .tab-item { padding: 10px 9px; }
        }

        /* ── SETTINGS TAB ── */
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 680px;
        }
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }
        .settings-title {
          font-size: 22px;
          font-weight: 700;
          color: #e8e3d9;
          margin: 0 0 5px;
        }
        .settings-desc {
          font-size: 13px;
          color: #5a6080;
          margin: 0;
        }

        /* Save button */
        .stg-save-btn {
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
        .stg-save-btn:hover:not(:disabled) { background: #6fa085; }
        .stg-save-btn:active:not(:disabled) { transform: scale(0.97); }
        .stg-save-btn.saved { background: #4a8060; color: #c8f0dc; }
        .stg-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Cards */
        .stg-card {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .danger-card { border-color: #e07a5f33; }
        .stg-card-heading { display: flex; flex-direction: column; gap: 3px; }
        .stg-card-title {
          font-size: 11px;
          font-weight: 700;
          color: #81b29a;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          margin: 0;
        }
        .danger-title { color: #e07a5f; }
        .stg-card-desc { font-size: 12px; color: #5a6080; margin: 0; }

        /* Fields */
        .stg-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .stg-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stg-label {
          font-size: 12px;
          font-weight: 500;
          color: #b0b8cc;
        }
        .stg-input {
          padding: 10px 13px;
          background: #1c2138;
          border: 1.5px solid #5060a0;
          border-radius: 8px;
          color: #e8e3d9;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .stg-input:focus {
          border-color: #81b29a;
          box-shadow: 0 0 0 3px rgba(129, 178, 154, 0.18);
        }
        .stg-input::placeholder { color: #606888; }
        .stg-select { cursor: pointer; }
        .stg-select option { background: #1c2138; }
        .stg-error {
          font-size: 11px;
          color: #e07a5f;
          margin: 0;
        }

        /* Colour swatches */
        .stg-swatches {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .stg-swatch {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
          flex-shrink: 0;
        }
        .stg-swatch:hover { transform: scale(1.15); }
        .stg-swatch.selected {
          border-color: #fff;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.25);
          transform: scale(1.18);
        }
        .stg-color-preview {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }
        .stg-color-bar {
          width: 28px;
          height: 6px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .stg-color-label {
          font-size: 12px;
          color: #5a6080;
        }

        /* Delete actions */
        .stg-btn-delete {
          padding: 10px 18px;
          background: transparent;
          border: 1.5px solid #e07a5f66;
          border-radius: 8px;
          color: #e07a5f;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, border-color 0.15s;
          align-self: flex-start;
        }
        .stg-btn-delete:hover {
          background: #e07a5f18;
          border-color: #e07a5f;
        }
        .delete-confirm {
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #1a100f;
          border: 1px solid #e07a5f44;
          border-radius: 10px;
          padding: 16px;
        }
        .delete-confirm-text {
          font-size: 13px;
          color: #c8a090;
          line-height: 1.6;
          margin: 0;
        }
        .delete-confirm-text strong { color: #e8e3d9; }
        .delete-confirm-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .stg-btn-cancel {
          padding: 9px 18px;
          background: none;
          border: 1px solid #2a3050;
          border-radius: 7px;
          color: #5a6080;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.15s, border-color 0.15s;
        }
        .stg-btn-cancel:hover { border-color: #5a6080; color: #c8c3b8; }
        .stg-btn-delete-confirm {
          padding: 9px 18px;
          background: #e07a5f;
          border: none;
          border-radius: 7px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .stg-btn-delete-confirm:hover { background: #c0604a; }

        /* Settings mobile */
        @media (max-width: 600px) {
          .settings-section { max-width: 100%; }
          .settings-header { flex-direction: column; align-items: stretch; }
          .stg-save-btn { width: 100%; text-align: center; padding: 12px; }
          .stg-card { padding: 16px; }
          .delete-confirm-actions { flex-direction: column-reverse; }
          .stg-btn-cancel,
          .stg-btn-delete-confirm { width: 100%; text-align: center; }
        }

        /* ── SUMMARY TAB ── */
        .summary-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sum-header { display: flex; align-items: flex-start; }
        .sum-title {
          font-size: 22px;
          font-weight: 700;
          color: #e8e3d9;
          margin: 0 0 6px;
        }
        .sum-desc {
          font-size: 13px;
          color: #5a6080;
          margin: 0;
        }

        /* Two-column layout: projected sales left, summary right */
        .sum-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 1fr);
          gap: 20px;
          align-items: start;
        }

        /* ── PROJECTED SALES PANEL ── */
        .proj-panel {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .proj-heading { display: flex; flex-direction: column; gap: 3px; }
        .proj-title {
          font-size: 11px;
          font-weight: 700;
          color: #81b29a;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          margin: 0;
        }
        .proj-desc { font-size: 12px; color: #5a6080; margin: 0; }

        .proj-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .proj-field { display: flex; flex-direction: column; gap: 6px; }
        .proj-label {
          font-size: 12px;
          color: #b0b8cc;
          font-weight: 500;
        }
        .proj-input-wrap {
          display: flex;
          align-items: stretch;
          background: #252b42;
          border: 1.5px solid #5060a0;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .proj-input-wrap:focus-within {
          border-color: #81b29a;
          box-shadow: 0 0 0 3px rgba(129, 178, 154, 0.18);
        }
        .proj-prefix, .proj-suffix {
          padding: 0 10px;
          font-size: 12px;
          font-weight: 600;
          color: #a0a8c0;
          white-space: nowrap;
          background: #1e2340;
          display: flex;
          align-items: center;
          user-select: none;
          flex-shrink: 0;
        }
        .proj-prefix { border-right: 1.5px solid #5060a0; }
        .proj-suffix { border-left: 1.5px solid #5060a0; }
        .proj-input {
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
        .proj-input-bare { padding-left: 12px; }
        .proj-input::placeholder { color: #606888; }
        .proj-hint { font-size: 11px; color: #4a5068; margin: 0; }

        .proj-discount-note {
          font-size: 12px;
          color: #f2cc8f;
          background: #1a1a0f;
          border: 1px solid #f2cc8f22;
          border-radius: 7px;
          padding: 8px 12px;
        }
        .proj-notice {
          font-size: 12px;
          color: #5a6080;
          background: #111520;
          border: 1px dashed #2a3050;
          border-radius: 8px;
          padding: 10px 14px;
          line-height: 1.5;
        }
        .proj-link {
          background: none;
          border: none;
          color: #81b29a;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .proj-link:hover { color: #a0d0b5; }

        /* ── FINANCIAL SUMMARY PANEL ── */
        .fin-summary-panel {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Break-even hero */
        .bev-hero {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .bev-hero.bev-profit { border-color: #81b29a44; background: #0f1a16; }
        .bev-hero.bev-loss  { border-color: #e07a5f44; background: #1a100f; }
        .bev-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          color: #5a6080;
        }
        .bev-value {
          font-size: 48px;
          font-weight: 800;
          line-height: 1;
          color: #e8e3d9;
        }
        .bev-hero.bev-profit .bev-value { color: #81b29a; }
        .bev-hero.bev-loss  .bev-value { color: #e07a5f; }
        .bev-sub { font-size: 12px; color: #5a6080; line-height: 1.5; }

        /* P&L card */
        .pnl-card {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pnl-card-title {
          font-size: 11px;
          font-weight: 700;
          color: #c8c3b8;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          margin: 0 0 4px;
        }
        .pnl-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #8a9080;
        }
        .pnl-total {
          font-weight: 700;
          font-size: 15px;
          color: #e8e3d9;
        }
        .pnl-divider { border-top: 1px solid #2a3050; margin: 2px 0; }
        .pos { color: #81b29a; }
        .neg { color: #e07a5f; }

        /* Snap cards */
        .sum-snap-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .sum-snap {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sum-snap-label {
          font-size: 10px;
          color: #5a6080;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .sum-snap-value {
          font-size: 16px;
          font-weight: 700;
          color: #e8e3d9;
        }

        @media (max-width: 900px) {
          .sum-layout { grid-template-columns: 1fr; }
          .fin-summary-panel { order: -1; }
        }
        @media (max-width: 600px) {
          .sum-title { font-size: 18px; }
          .bev-value { font-size: 36px; }
          .bev-hero { padding: 16px; }
          .sum-snap-grid { grid-template-columns: 1fr 1fr; }
          .proj-panel { padding: 16px; }
          .pnl-card { padding: 14px; }
        }
      `}</style>
    </div>
  );
}
