"use client";

import { useState, useEffect } from "react";
import CalendarSync, { CalendarSource } from "./CalendarSync";
import FinancialCalculator, { FinancialData } from "./FinancialCalculator";
import ExpenseTracker, { Expense } from "./ExpenseTracker";
import BookingTracker, { Booking } from "./BookingTracker";
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
  { id: "overview",  label: "Overview",      icon: "📊" },
  { id: "financials",label: "Financials",    icon: "💰" },
  { id: "bookings",  label: "Bookings",      icon: "📋" },
  { id: "summary",   label: "Summary",       icon: "📈" },
  { id: "expenses",  label: "Expenses",      icon: "🧾" },
  { id: "calendar",  label: "Calendar Sync", icon: "📅" },
  { id: "settings",  label: "Settings",      icon: "⚙️" },
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

  // ── Overview month filter ──
  const [overviewMonth, setOverviewMonth] = useState<string>(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // ── Summary monthly history ──
  const [summaryExpandedMonths, setSummaryExpandedMonths] = useState<Set<string>>(() => {
    const today = new Date();
    const k = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return new Set([k]);
  });

  // ── Per-listing persisted state ──
  const [financialData, setFinancialData] = useState<FinancialData>(() =>
    fromStorage(`bnb_fin_${listing.id}`, DEFAULT_FINANCIAL_DATA)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    fromStorage(`bnb_exp_${listing.id}`, [])
  );
  const [bookings, setBookings] = useState<Booking[]>(() =>
    fromStorage(`bnb_bkn_${listing.id}`, [])
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
    localStorage.setItem(`bnb_bkn_${listing.id}`, JSON.stringify(bookings));
  }, [bookings, listing.id]);

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

  const syncCalendarSource = (id: string, updates?: Partial<import("./CalendarSync").CalendarSource>) => {
    setCalendarSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "synced", lastSynced: "just now", ...updates }
          : s
      )
    );
  };

  const importBookingsFromIcal = (imported: import("../api/ical-sync/route").ImportedBooking[]) => {
    let added = 0, skipped = 0;
    setBookings((prev) => {
      // Existing UIDs come from bookings that were previously imported
      // We store the iCal UID as the booking id for imported bookings
      const existingIds = new Set(prev.map((b) => b.id));
      const newBookings: Booking[] = [];
      for (const imp of imported) {
        if (existingIds.has(imp.uid)) {
          skipped++;
          continue;
        }
        newBookings.push({
          id:            imp.uid,      // use UID so re-syncs are idempotent
          guestName:     imp.guestName,
          checkIn:       imp.checkIn,
          checkOut:      imp.checkOut,
          nights:        imp.nights,
          source:        imp.source,
          status:        imp.status,
          paymentStatus: imp.paymentStatus,
          chargeAmount:  imp.chargeAmount,
          discountAmount:imp.discountAmount,
          amountPaid:    imp.amountPaid,
          notes:         imp.notes,
          createdAt:     new Date().toISOString(),
        });
        added++;
      }
      return [...prev, ...newBookings];
    });
    return { added, skipped };
  };

  const addExpense = (expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [...prev, { ...expense, id: Date.now().toString() }]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const addBooking = (booking: Omit<Booking, "id" | "createdAt">) => {
    setBookings((prev) => [
      ...prev,
      { ...booking, id: Date.now().toString(), createdAt: new Date().toISOString() },
    ]);
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
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
        {activeTab === "overview" && (() => {
          const now            = new Date();
          const todayKey       = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const hour           = now.getHours();
          const greeting       = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
          const isCurrentMonth = overviewMonth === todayKey;

          // Parse overviewMonth into a Date for navigation & labelling
          const [ovYear, ovMon] = overviewMonth.split("-").map(Number);
          const ovDate    = new Date(ovYear, ovMon - 1, 1);
          const monthName = ovDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

          const shiftOvMonth = (delta: number) => {
            const d = new Date(ovYear, ovMon - 1 + delta, 1);
            setOverviewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          };

          // Collect months that have any data (for the mini dot strip)
          const dataMonths = new Set<string>();
          bookings.forEach(b => { if (b.checkIn) dataMonths.add(b.checkIn.slice(0, 7)); });
          expenses.forEach(e => { if (e.date)    dataMonths.add(e.date.slice(0, 7)); });

          // P&L for the selected month
          const monthBookings = bookings.filter(b => b.status !== "cancelled" && b.checkIn.startsWith(overviewMonth));
          const monthExpenses = expenses.filter(e => e.date.startsWith(overviewMonth));
          const actualRevenue = monthBookings.reduce((s, b) => s + b.amountPaid, 0);
          const fixedCosts    = financialData.monthlyRent + financialData.monthlyUtilities + financialData.monthlyCleaner;
          const monthExpTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
          const actualProfit  = actualRevenue - fixedCosts - monthExpTotal;
          const hasBookings   = monthBookings.length > 0;

          // When no bookings exist for the month, use 0 — no projection fallback
          const displayProfit  = hasBookings ? actualProfit : 0;
          const profitIsActual = hasBookings;

          // Build a 12-month strip (current month ± 5) for the month picker
          const stripMonths: string[] = [];
          for (let i = -5; i <= 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            stripMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          }

          return (
            <div className="ov2-root">
              {/* ── Greeting banner ── */}
              <div className="ov2-greeting" style={{ borderColor: `${listing.color}33`, background: `${listing.color}08` }}>
                <div className="ov2-greeting-left">
                  {isCurrentMonth && <p className="ov2-hello">{greeting} 👋</p>}
                  <h2 className="ov2-tagline">
                    Let&apos;s see your books<span className="ov2-tagline-month"> — {monthName}</span>
                  </h2>
                  <p className="ov2-tagline-sub">
                    {hasBookings
                      ? `${monthBookings.length} booking${monthBookings.length !== 1 ? "s" : ""} · ${formatCurrency(actualRevenue)} collected`
                      : isCurrentMonth
                        ? "No bookings logged yet this month — figures below are projections."
                        : "No bookings recorded for this month."}
                  </p>
                </div>
                <div className="ov2-greeting-badge" style={{ color: listing.color, borderColor: `${listing.color}44`, background: `${listing.color}12` }}>
                  {listing.type}
                </div>
              </div>

              {/* ── Month navigation ── */}
              <div className="ov2-month-nav">
                <button className="ov2-mn-arrow" onClick={() => { shiftOvMonth(-1); setShowMonthPicker(false); }} title="Previous month">‹</button>

                <div className="ov2-mn-picker-wrap">
                  <button
                    className={`ov2-mn-filter-btn${showMonthPicker ? " open" : ""}`}
                    onClick={() => setShowMonthPicker(v => !v)}
                  >
                    <span className="ov2-mn-filter-label">{monthName}</span>
                    {hasBookings && <span className="ov2-mn-filter-dot" />}
                    <span className="ov2-mn-filter-chevron">{showMonthPicker ? "▲" : "▼"}</span>
                  </button>

                  {showMonthPicker && (
                    <>
                      <div className="ov2-picker-backdrop" onClick={() => setShowMonthPicker(false)} />
                      <div className="ov2-picker-dropdown">
                        {stripMonths.map(mk => {
                          const [y, m] = mk.split("-").map(Number);
                          const fullLabel = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                          const isSelected = mk === overviewMonth;
                          const isToday    = mk === todayKey;
                          const hasData    = dataMonths.has(mk);
                          return (
                            <button
                              key={mk}
                              className={`ov2-picker-item${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
                              onClick={() => { setOverviewMonth(mk); setShowMonthPicker(false); }}
                            >
                              <span className="ov2-picker-item-label">{fullLabel}</span>
                              <span className="ov2-picker-item-right">
                                {isToday && <span className="ov2-picker-tag">Current</span>}
                                {hasData && <span className="ov2-picker-data-dot" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <button className="ov2-mn-arrow" onClick={() => { shiftOvMonth(1); setShowMonthPicker(false); }} title="Next month">›</button>

                {!isCurrentMonth && (
                  <button className="ov2-mn-today" onClick={() => { setOverviewMonth(todayKey); setShowMonthPicker(false); }}>
                    Today
                  </button>
                )}
              </div>

              {/* ── 4 KPI cards ── */}
              <div className="ov2-cards">
                {/* Setup Budget */}
                <div className="ov2-card">
                  <div className="ov2-card-icon">💰</div>
                  <div className="ov2-card-label">Total Setup Budget</div>
                  <div className="ov2-card-value">{formatCurrency(totalSetupCost)}</div>
                  <div className="ov2-card-sub">
                    {totalSetupCost > 0 ? "Initial capital invested" : "Set up in Financials →"}
                  </div>
                </div>

                {/* Price per stay */}
                <div className="ov2-card">
                  <div className="ov2-card-icon">🛏️</div>
                  <div className="ov2-card-label">Price Per Stay</div>
                  <div className="ov2-card-value">{formatCurrency(financialData.chargePerStay)}</div>
                  <div className="ov2-card-sub">
                    {financialData.discountPercent > 0
                      ? `Net after ${financialData.discountPercent}% fee: ${formatCurrency(effectiveRate)}`
                      : financialData.chargePerStay > 0 ? "Listed price · no platform fee set" : "Set in Financials →"}
                  </div>
                </div>

                {/* Projected sales */}
                <div className="ov2-card" style={{ borderColor: "#81b29a22" }}>
                  <div className="ov2-card-icon">📈</div>
                  <div className="ov2-card-label">Projected Sales — {monthName}</div>
                  <div className="ov2-card-value" style={{ color: "#81b29a" }}>{formatCurrency(projectedSales)}</div>
                  <div className="ov2-card-sub">
                    {financialData.projectedStaysPerMonth > 0
                      ? `${financialData.projectedStaysPerMonth} stays × ${formatCurrency(effectiveRate)}/stay`
                      : "Set stays/month in Financials →"}
                  </div>
                  <div className="ov2-card-actual">
                    <span className="ov2-actual-dot" />
                    Actual collected: {formatCurrency(actualRevenue)}
                  </div>
                </div>

                {/* Profit */}
                <div className="ov2-card" style={{ borderColor: displayProfit >= 0 ? "#81b29a22" : "#e07a5f22", background: displayProfit >= 0 ? "#0f1a1488" : "#1a100f88" }}>
                  <div className="ov2-card-icon">{displayProfit >= 0 ? "✅" : "⚠️"}</div>
                  <div className="ov2-card-label">
                    {profitIsActual ? "Actual Profit" : "Projected Profit"} — {monthName}
                  </div>
                  <div className="ov2-card-value ov2-profit-val" style={{ color: displayProfit >= 0 ? "#81b29a" : "#e07a5f" }}>
                    {formatCurrency(Math.abs(displayProfit))}
                    <span className="ov2-profit-sign">{displayProfit >= 0 ? " profit" : " loss"}</span>
                  </div>
                  <div className="ov2-card-sub">
                    {profitIsActual
                      ? `${formatCurrency(actualRevenue)} revenue − ${formatCurrency(fixedCosts)} fixed − ${formatCurrency(monthExpTotal)} expenses`
                      : "No bookings recorded for this month"}
                  </div>
                  {!profitIsActual && (
                    <div className="ov2-card-actual">
                      <span className="ov2-proj-dot" />
                      {isCurrentMonth ? "Log a booking to start tracking" : "No data for this month"}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Quick-action row ── */}
              <div className="ov2-cta-row">
                <button className="ov2-cta" onClick={() => setActiveTab("bookings")}>
                  <span>📋</span>
                  <div>
                    <div className="cta-title">Log a Booking</div>
                    <div className="cta-desc">Add guest, dates, payment status</div>
                  </div>
                  <span className="cta-arrow">→</span>
                </button>
                <button className="ov2-cta" onClick={() => setActiveTab("expenses")}>
                  <span>🧾</span>
                  <div>
                    <div className="cta-title">Log an Expense</div>
                    <div className="cta-desc">Track costs for {monthName}</div>
                  </div>
                  <span className="cta-arrow">→</span>
                </button>
                <button className="ov2-cta" onClick={() => setActiveTab("summary")}>
                  <span>📊</span>
                  <div>
                    <div className="cta-title">View Full P&amp;L History</div>
                    <div className="cta-desc">Every month saved automatically</div>
                  </div>
                  <span className="cta-arrow">→</span>
                </button>
              </div>
            </div>
          );
        })()}

        {activeTab === "financials" && (
          <FinancialCalculator data={financialData} onChange={setFinancialData} />
        )}

        {activeTab === "summary" && (() => {
          // ── Monthly P&L history ──────────────────────────────────────────────
          const today = new Date();
          const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

          // Collect every month that has any data, always include current month
          const monthSet = new Set<string>([currentMonthKey]);
          bookings.forEach((b) => { if (b.checkIn) monthSet.add(b.checkIn.slice(0, 7)); });
          expenses.forEach((e) => { if (e.date)   monthSet.add(e.date.slice(0, 7)); });
          const allMonthKeys = [...monthSet].sort((a, b) => b.localeCompare(a)); // newest first

          const getMonthLabel = (key: string) => {
            const [y, m] = key.split("-").map(Number);
            return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
          };

          // Build per-month P&L
          const monthlyPnl = allMonthKeys.map((key) => {
            const mBookings = bookings.filter((b) => b.status !== "cancelled" && b.checkIn.startsWith(key));
            const mExpenses = expenses.filter((e) => e.date.startsWith(key));
            const revenue       = mBookings.reduce((s, b) => s + b.amountPaid, 0);
            const pendingRev    = mBookings.reduce((s, b) => s + Math.max(0, b.chargeAmount - b.discountAmount - b.amountPaid), 0);
            const discountsGiven = mBookings.reduce((s, b) => s + b.discountAmount, 0);
            const grossCharged  = mBookings.reduce((s, b) => s + b.chargeAmount, 0);
            const mExpTotal     = mExpenses.reduce((s, e) => s + e.amount, 0);
            const fixedCosts    = financialData.monthlyRent + financialData.monthlyUtilities + financialData.monthlyCleaner;
            const totalCosts    = fixedCosts + mExpTotal;
            const profit        = revenue - totalCosts;
            const catBreakdown  = Object.entries(
              mExpenses.reduce<Record<string, number>>((acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + e.amount;
                return acc;
              }, {})
            ).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

            return {
              key, label: getMonthLabel(key), isCurrentMonth: key === currentMonthKey,
              bookings: mBookings, expenses: mExpenses, catBreakdown,
              revenue, pendingRev, discountsGiven, grossCharged,
              expensesTotal: mExpTotal, fixedCosts, totalCosts, profit,
            };
          });

          // All-time totals
          const atRevenue   = monthlyPnl.reduce((s, m) => s + m.revenue, 0);
          const atExpenses  = monthlyPnl.reduce((s, m) => s + m.expensesTotal, 0);
          const atProfit    = monthlyPnl.reduce((s, m) => s + m.profit, 0);
          const atBookings  = bookings.filter((b) => b.status !== "cancelled").length;
          const atDiscounts = bookings.reduce((s, b) => s + b.discountAmount, 0);

          const isExpanded = (k: string) => summaryExpandedMonths.has(k);
          const toggleExpand = (k: string) =>
            setSummaryExpandedMonths((prev) => {
              const next = new Set(prev);
              next.has(k) ? next.delete(k) : next.add(k);
              return next;
            });

          return (
            <div className="ms-root">
              {/* Header */}
              <div className="ms-header">
                <h2 className="ms-title">Monthly P&amp;L History</h2>
                <p className="ms-desc">
                  Every month is saved automatically — bookings collected, fixed costs, and logged expenses combined into a single profit figure.
                </p>
              </div>

              {/* All-time stats */}
              <div className="ms-alltime">
                <div className="ms-at-item">
                  <span className="ms-at-label">All-time Revenue</span>
                  <span className="ms-at-value ms-green">{formatCurrency(atRevenue)}</span>
                </div>
                <div className="ms-at-item">
                  <span className="ms-at-label">Expenses Logged</span>
                  <span className="ms-at-value ms-red">{formatCurrency(atExpenses)}</span>
                </div>
                <div className="ms-at-item">
                  <span className="ms-at-label">All-time Profit</span>
                  <span className="ms-at-value" style={{ color: atProfit >= 0 ? "#81b29a" : "#e07a5f" }}>
                    {formatCurrency(atProfit)}
                  </span>
                </div>
                <div className="ms-at-item">
                  <span className="ms-at-label">Total Bookings</span>
                  <span className="ms-at-value">{atBookings}</span>
                </div>
                {atDiscounts > 0 && (
                  <div className="ms-at-item">
                    <span className="ms-at-label">Discounts Given</span>
                    <span className="ms-at-value ms-amber">{formatCurrency(atDiscounts)}</span>
                  </div>
                )}
              </div>

              {/* Setup prompt */}
              {atBookings === 0 && expenses.length === 0 && (
                <div className="ms-empty">
                  <span>📊</span>
                  <p>
                    Set up your{" "}
                    <button className="ms-link" onClick={() => setActiveTab("financials")}>Financials</button>,
                    log{" "}
                    <button className="ms-link" onClick={() => setActiveTab("bookings")}>Bookings</button>,
                    and track{" "}
                    <button className="ms-link" onClick={() => setActiveTab("expenses")}>Expenses</button>{" "}
                    to see your monthly history here.
                  </p>
                </div>
              )}

              {/* Month cards */}
              <div className="ms-months">
                {monthlyPnl.map((month) => (
                  <div
                    key={month.key}
                    className="ms-card"
                    style={month.isCurrentMonth ? { borderColor: `${listing.color}66` } : {}}
                  >
                    {/* Card header — always visible, click to expand/collapse */}
                    <button className="ms-card-head" onClick={() => toggleExpand(month.key)}>
                      <div className="ms-head-left">
                        <span className="ms-month-name">{month.label}</span>
                        {month.isCurrentMonth && (
                          <span className="ms-badge" style={{ background: `${listing.color}22`, color: listing.color, borderColor: `${listing.color}44` }}>
                            Current
                          </span>
                        )}
                        <span className="ms-bk-count">
                          {month.bookings.length} booking{month.bookings.length !== 1 ? "s" : ""}
                          {month.expensesTotal > 0 && ` · ${month.expenses.length} expense${month.expenses.length !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="ms-head-right">
                        <div className="ms-head-nums">
                          <span className="ms-head-col">
                            <span className="ms-head-col-label">Revenue</span>
                            <span className="ms-head-col-val ms-green">{formatCurrency(month.revenue)}</span>
                          </span>
                          <span className="ms-head-div" />
                          <span className="ms-head-col">
                            <span className="ms-head-col-label">Costs</span>
                            <span className="ms-head-col-val ms-red">−{formatCurrency(month.totalCosts)}</span>
                          </span>
                          <span className="ms-head-div" />
                          <span className="ms-head-col">
                            <span className="ms-head-col-label">{month.profit >= 0 ? "Profit" : "Loss"}</span>
                            <span className="ms-head-col-val" style={{ color: month.profit >= 0 ? "#81b29a" : "#e07a5f", fontWeight: 800 }}>
                              {formatCurrency(Math.abs(month.profit))}
                            </span>
                          </span>
                        </div>
                        <span className="ms-chevron">{isExpanded(month.key) ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {/* Expanded body */}
                    {isExpanded(month.key) && (
                      <div className="ms-card-body">

                        {/* Revenue */}
                        <p className="ms-sec-label">Revenue</p>
                        {month.bookings.length > 0 ? (
                          <div className="ms-block">
                            {month.bookings.map((b) => (
                              <div key={b.id} className="ms-row">
                                <span className="ms-row-name">
                                  {b.guestName}
                                  <span className="ms-row-meta"> · {b.nights}n · {b.source}</span>
                                </span>
                                <span className="ms-row-val ms-green">{formatCurrency(b.amountPaid)}</span>
                              </div>
                            ))}
                            {month.pendingRev > 0 && (
                              <div className="ms-row ms-row-pending">
                                <span>Outstanding payments</span>
                                <span className="ms-amber">{formatCurrency(month.pendingRev)}</span>
                              </div>
                            )}
                            <div className="ms-row ms-row-sub">
                              <span>Total collected</span>
                              <span className="ms-green">{formatCurrency(month.revenue)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="ms-empty-row">
                            No bookings logged.
                            {month.isCurrentMonth && (
                              <button className="ms-link" onClick={() => setActiveTab("bookings")}> Add booking →</button>
                            )}
                          </div>
                        )}

                        <div className="ms-divider" />

                        {/* Fixed costs */}
                        <p className="ms-sec-label">Fixed Monthly Costs</p>
                        <div className="ms-block">
                          {financialData.monthlyRent > 0 && (
                            <div className="ms-row">
                              <span>Rent</span>
                              <span className="ms-row-val ms-red">−{formatCurrency(financialData.monthlyRent)}</span>
                            </div>
                          )}
                          {financialData.monthlyUtilities > 0 && (
                            <div className="ms-row">
                              <span>Utilities</span>
                              <span className="ms-row-val ms-red">−{formatCurrency(financialData.monthlyUtilities)}</span>
                            </div>
                          )}
                          {financialData.monthlyCleaner > 0 && (
                            <div className="ms-row">
                              <span>Cleaner</span>
                              <span className="ms-row-val ms-red">−{formatCurrency(financialData.monthlyCleaner)}</span>
                            </div>
                          )}
                          {month.fixedCosts === 0 && (
                            <div className="ms-empty-row">
                              No fixed costs set.{" "}
                              <button className="ms-link" onClick={() => setActiveTab("financials")}>Set in Financials →</button>
                            </div>
                          )}
                          {month.fixedCosts > 0 && (
                            <div className="ms-row ms-row-sub">
                              <span>Total fixed costs</span>
                              <span className="ms-row-val ms-red">−{formatCurrency(month.fixedCosts)}</span>
                            </div>
                          )}
                        </div>

                        {/* Expenses */}
                        {month.expensesTotal > 0 && (
                          <>
                            <div className="ms-divider" />
                            <p className="ms-sec-label">Expenses Logged ({month.expenses.length})</p>
                            <div className="ms-block">
                              {month.catBreakdown.map((cat) => (
                                <div key={cat.name} className="ms-row">
                                  <span>{cat.name}</span>
                                  <span className="ms-row-val ms-red">−{formatCurrency(cat.total)}</span>
                                </div>
                              ))}
                              <div className="ms-row ms-row-sub">
                                <span>Total expenses</span>
                                <span className="ms-row-val ms-red">−{formatCurrency(month.expensesTotal)}</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Discounts given */}
                        {month.discountsGiven > 0 && (
                          <div className="ms-discount-note">
                            💡 {formatCurrency(month.discountsGiven)} discounted to guests this month
                            — without discounts you would have earned {formatCurrency(month.grossCharged)}.
                          </div>
                        )}

                        <div className="ms-divider ms-divider-thick" />

                        {/* Net profit */}
                        <div className="ms-net-row">
                          <span className="ms-net-label">
                            {month.profit >= 0 ? "Net Profit" : "Net Loss"} — {month.label}
                          </span>
                          <span className="ms-net-val" style={{ color: month.profit >= 0 ? "#81b29a" : "#e07a5f" }}>
                            {formatCurrency(Math.abs(month.profit))}
                          </span>
                        </div>
                        {month.profit >= 0 && month.revenue > 0 && (
                          <p className="ms-hint ms-hint-green">
                            Profit margin: {((month.profit / month.revenue) * 100).toFixed(1)}%
                          </p>
                        )}
                        {month.profit < 0 && effectiveRate > 0 && (
                          <p className="ms-hint ms-hint-red">
                            Need {Math.ceil(Math.abs(month.profit) / effectiveRate)} more booking{Math.ceil(Math.abs(month.profit) / effectiveRate) !== 1 ? "s" : ""} at {formatCurrency(effectiveRate)}/stay to break even.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {activeTab === "bookings" && (
          <BookingTracker
            bookings={bookings}
            onAddBooking={addBooking}
            onUpdateBooking={updateBooking}
            onDeleteBooking={deleteBooking}
            accentColor={listing.color}
          />
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
            onImportBookings={importBookingsFromIcal}
            bookings={bookings}
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
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
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
        .listing-name { font-size: 20px; font-weight: 700; color: #e8e3d9; margin: 0; letter-spacing: -0.4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
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
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        /* ── OVERVIEW v2 ── */
        .ov2-root { display: flex; flex-direction: column; gap: 16px; }

        .ov2-greeting {
          border: 1px solid transparent;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .ov2-greeting-left { display: flex; flex-direction: column; gap: 4px; }
        .ov2-hello { font-size: 12px; color: #5a6080; margin: 0; letter-spacing: 0.4px; }
        .ov2-tagline { font-size: 22px; font-weight: 700; color: #e8e3d9; margin: 0; line-height: 1.2; }
        .ov2-tagline-month { color: #81b29a; font-weight: 400; }
        .ov2-tagline-sub { font-size: 12px; color: #5a6080; margin: 6px 0 0; line-height: 1.5; }
        .ov2-greeting-badge {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          border: 1px solid transparent;
          border-radius: 20px;
          padding: 5px 12px;
          margin-top: 2px;
        }

        .ov2-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .ov2-card {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 18px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: border-color 0.15s;
        }
        .ov2-card-icon { font-size: 18px; margin-bottom: 4px; }
        .ov2-card-label { font-size: 10px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; }
        .ov2-card-value { font-size: 22px; font-weight: 700; color: #e8e3d9; line-height: 1.1; margin-top: 4px; word-break: break-word; overflow-wrap: anywhere; }
        .ov2-profit-val { font-size: 26px; }
        .ov2-profit-sign { font-size: 12px; font-weight: 400; opacity: 0.7; }
        .ov2-card-sub { font-size: 11px; color: #4a5068; line-height: 1.4; margin-top: 4px; }
        .ov2-card-actual {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #81b29a;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #1e2130;
        }
        .ov2-actual-dot { width: 6px; height: 6px; border-radius: 50%; background: #81b29a; flex-shrink: 0; }
        .ov2-proj-dot  { width: 6px; height: 6px; border-radius: 50%; background: #f2cc8f; flex-shrink: 0; }
        .ov2-card-actual:has(.ov2-proj-dot) { color: #f2cc8f; }

        /* ── CTA ROW (shared .cta-title / .cta-desc / .cta-arrow) ── */
        .ov2-cta-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .ov2-cta {
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
        .ov2-cta:hover { border-color: #81B29A; background: #0f1a14; }
        .cta-title { font-size: 13px; font-weight: 600; color: #c8c3b8; margin-bottom: 2px; }
        .cta-desc { font-size: 11px; color: #4a5068; line-height: 1.4; }
        .cta-arrow { margin-left: auto; color: #2a3050; font-size: 16px; }
        .ov2-cta:hover .cta-arrow { color: #81B29A; }

        /* ── OVERVIEW MONTH NAV ── */
        .ov2-month-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #111520;
          border: 1px solid #1e2130;
          border-radius: 12px;
          padding: 8px 10px;
        }
        .ov2-mn-arrow {
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
        .ov2-mn-arrow:hover { background: #2a3050; color: #e8e3d9; }

        /* Filter button */
        .ov2-mn-picker-wrap {
          flex: 1;
          position: relative;
          min-width: 0;
        }
        .ov2-mn-filter-btn {
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
        .ov2-mn-filter-btn:hover,
        .ov2-mn-filter-btn.open { border-color: #81b29a55; background: #1c2540; }
        .ov2-mn-filter-label {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #e8e3d9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ov2-mn-filter-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #81b29a;
          flex-shrink: 0;
        }
        .ov2-mn-filter-chevron {
          font-size: 9px;
          color: #5a6080;
          flex-shrink: 0;
        }

        /* Backdrop */
        .ov2-picker-backdrop {
          position: fixed;
          inset: 0;
          z-index: 49;
        }

        /* Dropdown list */
        .ov2-picker-dropdown {
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
        .ov2-picker-dropdown::-webkit-scrollbar { width: 4px; }
        .ov2-picker-dropdown::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 2px; }

        .ov2-picker-item {
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
        .ov2-picker-item:last-child { border-bottom: none; }
        .ov2-picker-item:hover { background: #1c2138; }
        .ov2-picker-item.selected { background: #1a2430; }
        .ov2-picker-item-label {
          font-size: 13px;
          color: #8a9080;
          transition: color 0.12s;
        }
        .ov2-picker-item.selected .ov2-picker-item-label,
        .ov2-picker-item.today .ov2-picker-item-label { color: #81b29a; font-weight: 600; }
        .ov2-picker-item-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ov2-picker-tag {
          font-size: 10px;
          font-weight: 600;
          color: #81b29a;
          background: #81b29a18;
          border: 1px solid #81b29a44;
          border-radius: 4px;
          padding: 1px 6px;
          white-space: nowrap;
        }
        .ov2-picker-data-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #81b29a;
          opacity: 0.7;
        }

        /* Today button */
        .ov2-mn-today {
          background: #1e2130;
          border: 1px solid #2a3050;
          color: #81b29a;
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
        .ov2-mn-today:hover { background: #2a3050; }

        /* ── TABLET (≤ 900px) ── */
        @media (max-width: 900px) {
          .listing-quick-stats { display: none; }
          .tab-content { padding: 16px; }

          /* Overview */
          .ov2-cards   { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .ov2-cta-row { grid-template-columns: repeat(2, 1fr); }
          .ov2-tagline { font-size: 20px; }
        }

        /* ── MOBILE (≤ 600px) ── */
        @media (max-width: 600px) {
          /* Header */
          .listing-header { padding: 12px 14px; gap: 10px; flex-wrap: nowrap; overflow: hidden; }
          .listing-header-info { min-width: 0; overflow: hidden; }
          .listing-name-row { flex-wrap: nowrap; overflow: hidden; }
          .listing-name { font-size: 16px; }
          .listing-type-badge { display: none; }
          .listing-address { font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

          /* Tabs — icons only on mobile */
          .tab-item { padding: 10px 12px; font-size: 0; gap: 0; }
          .tab-item span:first-child { font-size: 18px; }
          .tab-item span:last-child { display: none; }
          .tab-item.active span:last-child { display: none; }

          /* Tab content */
          .tab-content { padding: 12px; }

          /* Overview root */
          .ov2-root { gap: 12px; }

          /* Greeting banner */
          .ov2-greeting { padding: 14px; flex-direction: column; gap: 8px; }
          .ov2-greeting-badge { align-self: flex-start; font-size: 10px; padding: 4px 10px; }
          .ov2-hello { font-size: 11px; }
          .ov2-tagline { font-size: 17px; }
          .ov2-tagline-month { display: block; }
          .ov2-tagline-sub { font-size: 11px; }

          /* Month nav */
          .ov2-month-nav { padding: 6px 8px; gap: 6px; }
          .ov2-mn-arrow { width: 28px; height: 28px; font-size: 16px; }
          .ov2-mn-filter-label { font-size: 13px; }
          .ov2-mn-today { font-size: 10px; padding: 5px 8px; }

          /* KPI cards — 2 columns on mobile */
          .ov2-cards { grid-template-columns: 1fr 1fr; gap: 10px; }
          .ov2-cards > .ov2-card:last-child { grid-column: auto; }
          .ov2-card { padding: 14px 12px; gap: 3px; }
          .ov2-card-icon { font-size: 16px; margin-bottom: 2px; }
          .ov2-card-label { font-size: 9px; }
          .ov2-card-value { font-size: 18px; }
          .ov2-profit-val { font-size: 20px; }
          .ov2-card-sub { font-size: 10px; }
          .ov2-card-actual { font-size: 10px; padding-top: 6px; margin-top: 6px; }
          .ov2-profit-sign { font-size: 11px; }

          /* CTA row */
          .ov2-cta-row { grid-template-columns: 1fr; }
          .ov2-cta { padding: 12px; font-size: 18px; }
          .cta-title { font-size: 12px; }
          .cta-desc { font-size: 10px; }
        }

        /* ── SMALL MOBILE (≤ 480px) — summary numbers ── */
        @media (max-width: 480px) {
          /* Summary month card header: stack numbers 2+1 */
          .ms-card-head { padding: 12px 14px; gap: 10px; }
          .ms-head-right { flex-direction: column; align-items: stretch; gap: 8px; }
          .ms-head-nums {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 10px;
          }
          .ms-head-div { display: none; }
          .ms-head-col { align-items: flex-start; }
          .ms-head-col:last-child { grid-column: 1 / -1; }
          .ms-head-col-val { font-size: 13px; }
          .ms-chevron { display: none; }
          .ms-month-name { font-size: 14px; }
          .ms-card-body { padding: 0 12px 14px; }
          .ms-net-val { font-size: 18px; }
          .ms-net-label { font-size: 13px; }
          /* All-time grid: 2 columns */
          .ms-alltime { grid-template-columns: repeat(2, 1fr); }

          /* Overview: greeting stacks */
          .ov2-greeting { padding: 12px; }
          .ov2-tagline { font-size: 16px; }
          /* KPI cards: tighter */
          .ov2-card-value { font-size: 16px; }
          .ov2-card { padding: 12px 10px; }
          .ov2-card-sub { font-size: 9px; }
          /* CTA: compact */
          .ov2-cta { gap: 8px; padding: 10px; font-size: 16px; }
        }

        /* ── SMALL MOBILE (≤ 380px) ── */
        @media (max-width: 380px) {
          .tab-item { padding: 10px 9px; }

          /* Stack all 4 cards vertically */
          .ov2-cards { grid-template-columns: 1fr; }
          .ov2-cards > .ov2-card:last-child { grid-column: auto; }
          .ov2-card-value { font-size: 18px; }
          .ov2-profit-val { font-size: 18px; }
          .ov2-tagline { font-size: 15px; }

          /* Tab content tighter */
          .tab-content { padding: 10px; }

          /* Month nav */
          .ov2-mn-filter-label { font-size: 12px; }
          .ov2-mn-today { display: none; }

          /* Summary: single column alltime */
          .ms-alltime { grid-template-columns: 1fr; }
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

        /* ── MONTHLY SUMMARY TAB ── */
        .ms-root { display: flex; flex-direction: column; gap: 20px; }
        .ms-header { display: flex; flex-direction: column; gap: 4px; }
        .ms-title { font-size: 22px; font-weight: 700; color: #e8e3d9; margin: 0; }
        .ms-desc  { font-size: 13px; color: #5a6080; margin: 0; line-height: 1.5; }

        /* All-time stats */
        .ms-alltime {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }
        .ms-at-item {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .ms-at-label { font-size: 10px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; }
        .ms-at-value { font-size: 18px; font-weight: 800; color: #e8e3d9; }

        /* Empty state */
        .ms-empty {
          background: #161924;
          border: 1px dashed #2a3050;
          border-radius: 12px;
          padding: 36px 24px;
          text-align: center;
          color: #4a5068;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .ms-empty span { font-size: 32px; }
        .ms-empty p { margin: 0; line-height: 1.6; }
        .ms-link {
          background: none; border: none;
          color: #81b29a; cursor: pointer;
          font-family: inherit; font-size: inherit;
          padding: 0; text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* Month card list */
        .ms-months { display: flex; flex-direction: column; gap: 8px; }
        .ms-card {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.15s;
        }

        /* Card header button */
        .ms-card-head {
          width: 100%;
          min-width: 0;
          background: none;
          border: none;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: background 0.15s;
          flex-wrap: wrap;
          box-sizing: border-box;
        }
        .ms-card-head:hover { background: #1c2138; }
        .ms-head-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
        .ms-month-name { font-size: 16px; font-weight: 700; color: #e8e3d9; white-space: nowrap; }
        .ms-badge {
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }
        .ms-bk-count { font-size: 12px; color: #4a5068; white-space: nowrap; }

        .ms-head-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; min-width: 0; }
        .ms-head-nums { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
        .ms-head-col { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; min-width: 0; }
        .ms-head-col-label { font-size: 10px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.7px; white-space: nowrap; }
        .ms-head-col-val { font-size: 14px; font-weight: 700; color: #e8e3d9; white-space: nowrap; overflow-wrap: anywhere; }
        .ms-head-div { width: 1px; height: 32px; background: #2a3050; flex-shrink: 0; }
        .ms-chevron { font-size: 9px; color: #4a5068; flex-shrink: 0; }

        /* Card body */
        .ms-card-body {
          padding: 0 20px 20px;
          border-top: 1px solid #1e2130;
        }
        .ms-sec-label {
          font-size: 10px;
          font-weight: 700;
          color: #4a5068;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 14px 0 8px;
          margin: 0;
        }
        .ms-block { display: flex; flex-direction: column; gap: 7px; }
        .ms-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #8a9080;
          gap: 8px;
        }
        .ms-row-name { flex: 1; }
        .ms-row-meta { color: #4a5068; font-size: 11px; font-weight: 400; }
        .ms-row-val { white-space: nowrap; font-weight: 600; }
        .ms-row-sub {
          font-weight: 700;
          color: #c8c3b8;
          border-top: 1px dashed #2a3050;
          padding-top: 6px;
          margin-top: 2px;
        }
        .ms-row-pending { color: #5a6080; font-style: italic; }
        .ms-empty-row { font-size: 12px; color: #4a5068; font-style: italic; padding: 4px 0; }

        .ms-divider { border-top: 1px solid #1e2130; margin: 10px 0; }
        .ms-divider-thick { border-color: #2a3050; border-top-width: 2px; }

        .ms-discount-note {
          font-size: 12px;
          color: #f2cc8f;
          background: #1a1a0f;
          border: 1px solid #f2cc8f22;
          border-radius: 7px;
          padding: 8px 12px;
          margin-top: 6px;
          line-height: 1.5;
        }

        .ms-net-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 8px 0 2px;
        }
        .ms-net-label { font-size: 14px; font-weight: 700; color: #e8e3d9; }
        .ms-net-val { font-size: 26px; font-weight: 800; white-space: nowrap; }
        .ms-hint { font-size: 12px; margin: 4px 0 0; line-height: 1.5; }
        .ms-hint-green { color: #5a7060; }
        .ms-hint-red   { color: #905050; }

        /* Colour utilities */
        .ms-green { color: #81b29a; }
        .ms-red   { color: #e07a5f; }
        .ms-amber { color: #f2cc8f; }

        /* Responsive */
        @media (max-width: 700px) {
          .ms-card-head { flex-direction: column; align-items: stretch; }
          .ms-head-right { justify-content: space-between; }
          .ms-head-nums { gap: 6px; }
          .ms-head-col-val { font-size: 13px; }
          .ms-net-val { font-size: 20px; }
          .ms-month-name { font-size: 14px; }
          .ms-card-body { padding: 0 14px 16px; }
        }
      `}</style>
    </div>
  );
}
