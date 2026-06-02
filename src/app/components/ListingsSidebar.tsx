"use client";

import { useState, useRef, useCallback } from "react";
import { useDismissOnEscape, useDismissOnClickOutside } from "@/lib/useDismiss";

export interface Listing {
  id: string;
  name: string;
  address: string;
  type: string;
  color: string;
  imageUrl?: string;
}

interface ListingsSidebarProps {
  listings: Listing[];
  activeListing: string | null;
  onSelectListing: (id: string) => void;
  onAddListing: (listing: Omit<Listing, "id">) => void;
  userLabel?: string;
  userEmail?: string;
  onSignOut?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const LISTING_COLORS = [
  "#E07A5F", "#3D405B", "#81B29A", "#F2CC8F",
  "#118AB2", "#06D6A0", "#EF476F", "#FFD166",
];

const LISTING_TYPES = [
  "Apartment", "House", "Villa", "Studio",
  "Cottage", "Cabin", "Condo", "Room",
];

export default function ListingsSidebar({
  listings,
  activeListing,
  onSelectListing,
  onAddListing,
  userLabel,
  userEmail,
  onSignOut,
  isOpen = false,
  onClose,
}: ListingsSidebarProps) {
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const closeForm = useCallback(() => setShowForm(false), []);
  useDismissOnEscape(showForm, closeForm);
  useDismissOnClickOutside(formRef, showForm, closeForm);

  const [form, setForm] = useState({
    name: "",
    address: "",
    type: "Apartment",
    color: LISTING_COLORS[0],
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onAddListing(form);
    setForm({ name: "", address: "", type: "Apartment", color: LISTING_COLORS[0] });
    setShowForm(false);
  };

  return (
    <aside className={`listings-sidebar${isOpen ? " sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Tractar" className="sidebar-logo-img" />
        </div>
        <p className="sidebar-subtitle">Your Properties</p>
        {/* Close button — mobile only */}
        {onClose && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        )}
      </div>

      <nav className="listings-nav">
        {listings.length === 0 && !showForm && (
          <div className="empty-state">
            <p>No listings yet.<br />Add your first property.</p>
          </div>
        )}

        {listings.map((listing) => (
          <button
            key={listing.id}
            className={`listing-item ${activeListing === listing.id ? "active" : ""}`}
            onClick={() => onSelectListing(listing.id)}
          >
            <span
              className="listing-color-dot"
              style={{ background: listing.color }}
            />
            <div className="listing-item-info">
              <span className="listing-item-name">{listing.name}</span>
              <span className="listing-item-type">{listing.type}</span>
            </div>
            {activeListing === listing.id && (
              <span className="active-indicator">→</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {showForm ? (
          <div className="add-listing-form" ref={formRef}>
            <p className="form-title">New Property</p>
            <input
              className="form-input"
              placeholder="Property name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <select
              className="form-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {LISTING_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <div className="color-picker">
              <span className="color-label">Color tag:</span>
              <div className="color-swatches">
                {LISTING_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${form.color === c ? "selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn-add" onClick={handleSubmit}>
                Add Property
              </button>
            </div>
          </div>
        ) : (
          <button className="add-listing-btn" onClick={() => setShowForm(true)}>
            <span>+</span> Add Property
          </button>
        )}
      </div>

      <div className="sidebar-feedback">
        <a
          href="https://forms.gle/AtsJdJV4RC4Co6HG6"
          target="_blank"
          rel="noopener noreferrer"
          className="feedback-btn"
        >
          <span>Share Feedback</span>
        </a>
      </div>

      {onSignOut ? (
        <div className="sidebar-account">
          <div className="sidebar-account-info">
            <span className="sidebar-account-name">
              {userLabel ?? "Account"}
            </span>
            {userEmail ? (
              <span className="sidebar-account-email">{userEmail}</span>
            ) : null}
          </div>
          <button type="button" className="sidebar-sign-out" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      ) : null}

      <style jsx>{`
        .listings-sidebar {
          width: 260px;
          min-height: 100vh;
          background: #0f1117;
          border-right: 1px solid #1e2130;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
          transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 767px) {
          .listings-sidebar {
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
          }
          .listings-sidebar.sidebar-open {
            transform: translateX(0);
          }
        }
        .sidebar-header {
          padding: 28px 20px 20px;
          border-bottom: 1px solid #1e2130;
          position: relative;
        }
        .sidebar-close-btn {
          display: none;
          position: absolute;
          top: 16px;
          right: 16px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 6px;
          color: #5a6080;
          font-size: 13px;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.15s;
        }
        .sidebar-close-btn:hover { color: #e8e3d9; }
        @media (max-width: 767px) {
          .sidebar-close-btn { display: flex; }
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
        .sidebar-logo-img {
          height: 48px;
          width: auto;
          display: block;
          filter: brightness(0) invert(1);
        }
        .sidebar-subtitle {
          font-size: 11px;
          color: #4a5068;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding-left: 32px;
        }
        .listings-nav {
          flex: 1;
          padding: 12px 0;
          overflow-y: auto;
        }
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #4a5068;
          font-size: 13px;
          line-height: 1.6;
        }
        .empty-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 12px;
        }
        .listing-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          position: relative;
        }
        .listing-item:hover {
          background: #161924;
        }
        .listing-item.active {
          background: #161924;
        }
        .listing-item:focus-visible {
          outline: 2px solid #81b29a;
          outline-offset: -2px;
        }
        .add-listing-btn:focus-visible,
        .btn-add:focus-visible,
        .sidebar-sign-out:focus-visible,
        .sidebar-close-btn:focus-visible {
          outline: 2px solid #81b29a;
          outline-offset: 2px;
        }
        .listing-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .listing-item-info {
          flex: 1;
        }
        .listing-item-name {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #c8c3b8;
        }
        .listing-item-type {
          display: block;
          font-size: 11px;
          color: #4a5068;
          margin-top: 1px;
        }
        .active-indicator {
          color: #81B29A;
          font-size: 14px;
        }
        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid #1e2130;
        }
        .add-listing-btn {
          width: 100%;
          padding: 10px;
          background: #1e2130;
          border: 1px dashed #2a3050;
          border-radius: 8px;
          color: #4a5068;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: inherit;
        }
        .add-listing-btn:hover {
          border-color: #81B29A;
          color: #81B29A;
          background: #151d18;
        }
        .add-listing-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-title {
          font-size: 12px;
          font-weight: 600;
          color: #81B29A;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 4px;
        }
        .form-input {
          width: 100%;
          padding: 8px 10px;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 6px;
          color: #e8e3d9;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: #81B29A;
        }
        .color-label {
          font-size: 11px;
          color: #4a5068;
        }
        .color-picker {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .color-swatches {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .color-swatch.selected {
          border-color: #fff;
          transform: scale(1.2);
        }
        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .btn-cancel {
          flex: 1;
          padding: 8px;
          background: none;
          border: 1px solid #2a3050;
          border-radius: 6px;
          color: #4a5068;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-add {
          flex: 1;
          padding: 8px;
          background: #81B29A;
          border: none;
          border-radius: 6px;
          color: #0f1117;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .sidebar-feedback {
          padding: 8px 16px 4px;
        }
        .feedback-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 9px 12px;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 8px;
          color: #7a8aaa;
          font-size: 13px;
          font-family: inherit;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          cursor: pointer;
        }
        .feedback-btn:hover {
          border-color: #81B29A;
          color: #81B29A;
          background: #141c18;
        }
        .feedback-icon {
          font-size: 15px;
          line-height: 1;
        }
        .sidebar-account {
          padding: 12px 16px 20px;
          border-top: 1px solid #1e2130;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sidebar-account-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 4px;
        }
        .sidebar-account-name {
          font-size: 13px;
          font-weight: 600;
          color: #c8c3b8;
        }
        .sidebar-account-email {
          font-size: 11px;
          color: #4a5068;
          word-break: break-all;
        }
        .sidebar-sign-out {
          width: 100%;
          padding: 8px 10px;
          background: transparent;
          border: 1px solid #2a3050;
          border-radius: 6px;
          color: #4a5068;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .sidebar-sign-out:hover {
          border-color: #e07a5f;
          color: #e07a5f;
        }
      `}</style>
    </aside>
  );
}
