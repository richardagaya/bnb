"use client";

import { useState } from "react";

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  recurring: boolean;
  period?: "monthly" | "one-time";
  receipt?: string;
}

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onDeleteExpense: (id: string) => void;
}

const CATEGORIES = [
  { name: "Cleaning", icon: "🧹", color: "#81B29A" },
  { name: "Utilities", icon: "⚡", color: "#F2CC8F" },
  { name: "Maintenance & Repairs", icon: "🔧", color: "#E07A5F" },
  { name: "Platform Fees", icon: "💳", color: "#118AB2" },
  { name: "Insurance", icon: "🛡️", color: "#3D405B" },
  { name: "Mortgage / Rent", icon: "🏦", color: "#6C63FF" },
  { name: "Supplies", icon: "🛍️", color: "#06D6A0" },
  { name: "Management", icon: "👤", color: "#EF476F" },
  { name: "Furniture", icon: "🪑", color: "#FFD166" },
  { name: "Marketing", icon: "📣", color: "#FF9F1C" },
  { name: "Taxes", icon: "📋", color: "#2EC4B6" },
  { name: "Other", icon: "📦", color: "#8B8B8B" },
];

const getCategoryMeta = (name: string) =>
  CATEGORIES.find((c) => c.name === name) || CATEGORIES[CATEGORIES.length - 1];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(amount: number) {
  return `KSh ${new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export default function ExpenseTracker({
  expenses,
  onAddExpense,
  onDeleteExpense,
}: ExpenseTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [form, setForm] = useState<Omit<Expense, "id">>({
    date: new Date().toISOString().split("T")[0],
    category: "Cleaning",
    description: "",
    amount: 0,
    recurring: false,
    period: "one-time",
  });

  const handleAdd = () => {
    if (!form.description.trim() || form.amount <= 0) return;
    onAddExpense(form);
    setForm({
      date: new Date().toISOString().split("T")[0],
      category: "Cleaning",
      description: "",
      amount: 0,
      recurring: false,
      period: "one-time",
    });
    setShowForm(false);
  };

  const filtered = expenses
    .filter((e) => filter === "All" || e.category === filter)
    .sort((a, b) =>
      sortBy === "date"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : b.amount - a.amount
    );

  const totalByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const recurringTotal = expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="expense-tracker">
      <div className="tracker-header">
        <div>
          <h2 className="section-title">Expense Tracker</h2>
          <p className="section-desc">Log and categorize every expense. Spot missed costs before they hurt your ROI.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Expense
        </button>
      </div>

      {/* Summary Row */}
      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Logged</span>
          <span className="summary-value">{formatCurrency(grandTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Recurring Monthly</span>
          <span className="summary-value recurring">{formatCurrency(recurringTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">One-time Costs</span>
          <span className="summary-value">{formatCurrency(grandTotal - recurringTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Entries</span>
          <span className="summary-value">{expenses.length}</span>
        </div>
      </div>

      {/* Category breakdown */}
      {totalByCategory.length > 0 && (
        <div className="category-breakdown">
          <h4 className="breakdown-title">Spending by Category</h4>
          <div className="breakdown-bars">
            {totalByCategory.slice(0, 6).map((cat) => (
              <div key={cat.name} className="breakdown-item">
                <div className="breakdown-label">
                  <span>{cat.icon} {cat.name}</span>
                  <span className="breakdown-amount">{formatCurrency(cat.total)}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(cat.total / totalByCategory[0].total) * 100}%`,
                      background: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="add-form-card">
          <h3 className="form-title">Log Expense</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Amount (KSh)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group full">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                placeholder="e.g. Plumber call-out for bathroom"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group full">
              <label className="form-label">Category</label>
              <div className="category-grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    className={`cat-btn ${form.category === cat.name ? "selected" : ""}`}
                    style={form.category === cat.name ? { borderColor: cat.color, background: `${cat.color}18`, color: cat.color } : {}}
                    onClick={() => setForm({ ...form, category: cat.name })}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="toggle-group">
                <button
                  className={`toggle-btn ${!form.recurring ? "active" : ""}`}
                  onClick={() => setForm({ ...form, recurring: false, period: "one-time" })}
                >
                  One-time
                </button>
                <button
                  className={`toggle-btn ${form.recurring ? "active" : ""}`}
                  onClick={() => setForm({ ...form, recurring: true, period: "monthly" })}
                >
                  Recurring
                </button>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleAdd}>Save Expense</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="list-controls">
        <div className="filter-chips">
          <button
            className={`filter-chip ${filter === "All" ? "active" : ""}`}
            onClick={() => setFilter("All")}
          >
            All
          </button>
          {CATEGORIES.filter((c) => expenses.some((e) => e.category === c.name)).map((cat) => (
            <button
              key={cat.name}
              className={`filter-chip ${filter === cat.name ? "active" : ""}`}
              style={filter === cat.name ? { borderColor: cat.color, color: cat.color } : {}}
              onClick={() => setFilter(cat.name)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
        >
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
        </select>
      </div>

      {/* Expense List */}
      <div className="expenses-list">
        {filtered.length === 0 ? (
          <div className="empty-expenses">
            <span>📊</span>
            <p>No expenses logged yet. Start tracking your costs to understand your true profitability.</p>
          </div>
        ) : (
          filtered.map((expense) => {
            const meta = getCategoryMeta(expense.category);
            return (
              <div key={expense.id} className="expense-row">
                <div className="expense-cat-icon" style={{ background: `${meta.color}22`, color: meta.color }}>
                  {meta.icon}
                </div>
                <div className="expense-info">
                  <span className="expense-desc">{expense.description}</span>
                  <span className="expense-meta">
                    {meta.name} · {formatDate(expense.date)}
                    {expense.recurring && <span className="recurring-badge">↻ Monthly</span>}
                  </span>
                </div>
                <span className="expense-amount">-{formatCurrency(expense.amount)}</span>
                <button className="delete-btn" onClick={() => onDeleteExpense(expense.id)}>✕</button>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .expense-tracker { display: flex; flex-direction: column; gap: 20px; }
        .tracker-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .section-title { font-size: 22px; font-weight: 700; color: #e8e3d9; margin: 0 0 6px; }
        .section-desc { font-size: 13px; color: #5a6080; margin: 0; }
        .btn-primary { padding: 10px 18px; background: #81B29A; border: none; border-radius: 8px; color: #0f1117; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .btn-secondary { padding: 10px 18px; background: none; border: 1px solid #2a3050; border-radius: 8px; color: #5a6080; font-size: 13px; cursor: pointer; font-family: inherit; }

        .summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .summary-card { background: #161924; border: 1px solid #1e2130; border-radius: 10px; padding: 14px 16px; }
        .summary-label { display: block; font-size: 11px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
        .summary-value { font-size: 20px; font-weight: 700; color: #e8e3d9; }
        .summary-value.recurring { color: #F2CC8F; }

        .category-breakdown { background: #161924; border: 1px solid #1e2130; border-radius: 10px; padding: 16px; }
        .breakdown-title { font-size: 12px; font-weight: 600; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 14px; }
        .breakdown-bars { display: flex; flex-direction: column; gap: 10px; }
        .breakdown-item { display: flex; flex-direction: column; gap: 5px; }
        .breakdown-label { display: flex; justify-content: space-between; font-size: 12px; color: #8a9080; }
        .breakdown-amount { color: #c8c3b8; font-weight: 500; }
        .bar-track { height: 4px; background: #1e2130; border-radius: 2px; }
        .bar-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }

        .add-form-card { background: #161924; border: 1px solid #2a3050; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .form-title { font-size: 15px; font-weight: 600; color: #e8e3d9; margin: 0; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-size: 12px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; }
        .form-input { padding: 9px 12px; background: #1e2130; border: 1px solid #2a3050; border-radius: 7px; color: #e8e3d9; font-size: 13px; font-family: inherit; outline: none; }
        .form-input:focus { border-color: #81B29A; }
        .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .category-grid { display: flex; flex-wrap: wrap; gap: 7px; }
        .cat-btn { padding: 6px 11px; background: #1e2130; border: 1px solid #2a3050; border-radius: 6px; color: #5a6080; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
        .toggle-group { display: flex; background: #1e2130; border-radius: 7px; padding: 3px; border: 1px solid #2a3050; width: fit-content; }
        .toggle-btn { padding: 6px 16px; border: none; background: none; color: #5a6080; font-size: 12px; cursor: pointer; border-radius: 5px; font-family: inherit; }
        .toggle-btn.active { background: #81B29A; color: #0f1117; font-weight: 600; }

        .list-controls { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .filter-chip { padding: 5px 12px; background: #161924; border: 1px solid #2a3050; border-radius: 20px; color: #5a6080; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .filter-chip.active { border-color: #81B29A; color: #81B29A; background: #0f1a14; }
        .sort-select { padding: 7px 12px; background: #161924; border: 1px solid #2a3050; border-radius: 7px; color: #5a6080; font-size: 12px; font-family: inherit; outline: none; cursor: pointer; }

        .expenses-list { display: flex; flex-direction: column; gap: 6px; }
        .empty-expenses { background: #161924; border: 1px dashed #2a3050; border-radius: 10px; padding: 32px; text-align: center; color: #4a5068; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .empty-expenses span { font-size: 28px; }
        .expense-row { background: #161924; border: 1px solid #1e2130; border-radius: 9px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; transition: border-color 0.15s; }
        .expense-row:hover { border-color: #2a3050; }
        .expense-cat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .expense-info { flex: 1; min-width: 0; }
        .expense-desc { display: block; font-size: 14px; color: #c8c3b8; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .expense-meta { display: block; font-size: 11px; color: #4a5068; margin-top: 2px; }
        .recurring-badge { background: #1a1e10; border: 1px solid #81B29A44; color: #81B29A; border-radius: 4px; padding: 1px 6px; margin-left: 8px; font-size: 10px; }
        .expense-amount { font-size: 15px; font-weight: 600; color: #E07A5F; white-space: nowrap; }
        .delete-btn { padding: 4px 8px; background: none; border: 1px solid transparent; border-radius: 5px; color: #3a4060; font-size: 11px; cursor: pointer; transition: all 0.15s; }
        .delete-btn:hover { border-color: #E07A5F44; color: #E07A5F; }

        /* ── TABLET ── */
        @media (max-width: 640px) {
          .summary-row { grid-template-columns: repeat(2, 1fr); }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full { grid-column: 1; }
        }

        /* ── MOBILE ── */
        @media (max-width: 500px) {
          .tracker-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .btn-primary { width: 100%; text-align: center; padding: 12px; }
          .summary-row { grid-template-columns: 1fr 1fr; gap: 8px; }
          .summary-value { font-size: 16px; }
          .add-form-card { padding: 16px; }
          .form-actions { flex-direction: column-reverse; }
          .btn-secondary { width: 100%; text-align: center; }
          .expense-row { padding: 10px 12px; gap: 10px; }
          .expense-desc { font-size: 13px; }
          .expense-amount { font-size: 13px; }
          .list-controls { flex-direction: column; align-items: stretch; gap: 8px; }
          .sort-select { width: 100%; }
          .section-title { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
