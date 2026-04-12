"use client";

import { useState } from "react";

export interface CalendarSource {
  id: string;
  platform: string;
  url: string;
  color: string;
  lastSynced: string | null;
  status: "synced" | "error" | "pending";
}

interface CalendarSyncProps {
  listingId: string;
  sources: CalendarSource[];
  onAddSource: (source: Omit<CalendarSource, "id" | "lastSynced" | "status">) => void;
  onRemoveSource: (id: string) => void;
  onSync: (id: string) => void;
}

const PLATFORMS = [
  { name: "Airbnb", color: "#FF5A5F", icon: "🏠" },
  { name: "Booking.com", color: "#003580", icon: "🔵" },
  { name: "VRBO", color: "#1A5276", icon: "🏡" },
  { name: "Expedia", color: "#FFC72C", icon: "✈️" },
  { name: "TripAdvisor", color: "#34E0A1", icon: "🦉" },
  { name: "Direct", color: "#81B29A", icon: "📅" },
  { name: "Other", color: "#8B8B8B", icon: "🗓️" },
];

export default function CalendarSync({
  listingId,
  sources,
  onAddSource,
  onRemoveSource,
  onSync,
}: CalendarSyncProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: "Airbnb", url: "" });
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!form.url.trim()) return;
    const platformData = PLATFORMS.find((p) => p.name === form.platform);
    onAddSource({
      platform: form.platform,
      url: form.url,
      color: platformData?.color || "#81B29A",
    });
    setForm({ platform: "Airbnb", url: "" });
    setShowForm(false);
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    await new Promise((res) => setTimeout(res, 1500));
    onSync(id);
    setSyncingId(null);
  };

  const platformMeta = (name: string) =>
    PLATFORMS.find((p) => p.name === name) || PLATFORMS[PLATFORMS.length - 1];

  return (
    <div className="calendar-sync">
      <div className="section-header">
        <div>
          <h2 className="section-title">Calendar Sync</h2>
          <p className="section-desc">
            Connect your iCal feeds from all booking platforms to track availability across channels.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Calendar
        </button>
      </div>

      {sources.length === 0 && !showForm && (
        <div className="empty-calendar">
          <div className="empty-icon">📅</div>
          <p className="empty-title">No calendars connected</p>
          <p className="empty-desc">
            Add your iCal URLs from Airbnb, Booking.com, VRBO, and other platforms to sync bookings automatically.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Connect Your First Calendar
          </button>
        </div>
      )}

      {showForm && (
        <div className="add-form-card">
          <h3 className="form-title">Add Calendar Feed</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Platform</label>
              <div className="platform-grid">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.name}
                    className={`platform-btn ${form.platform === p.name ? "selected" : ""}`}
                    style={form.platform === p.name ? { borderColor: p.color, background: `${p.color}18` } : {}}
                    onClick={() => setForm({ ...form, platform: p.name })}
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">iCal URL</label>
            <input
              className="form-input"
              placeholder="https://www.airbnb.com/calendar/ical/..."
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <p className="form-hint">
              Find this in your platform's calendar export settings. Usually under "Availability" → "Export Calendar".
            </p>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAdd}>
              Add Calendar
            </button>
          </div>
        </div>
      )}

      <div className="sources-list">
        {sources.map((source) => {
          const meta = platformMeta(source.platform);
          return (
            <div key={source.id} className="source-card">
              <div className="source-platform-badge" style={{ background: `${meta.color}22`, borderColor: `${meta.color}44` }}>
                <span>{meta.icon}</span>
                <span style={{ color: meta.color }} className="platform-name">{source.platform}</span>
              </div>
              <div className="source-info">
                <div className="source-url">{source.url}</div>
                <div className="source-meta">
                  <span className={`status-dot ${source.status}`} />
                  <span className="status-text">
                    {source.status === "synced" && source.lastSynced
                      ? `Synced ${source.lastSynced}`
                      : source.status === "error"
                      ? "Sync failed"
                      : "Pending sync"}
                  </span>
                </div>
              </div>
              <div className="source-actions">
                <button
                  className={`sync-btn ${syncingId === source.id ? "syncing" : ""}`}
                  onClick={() => handleSync(source.id)}
                  disabled={syncingId === source.id}
                >
                  {syncingId === source.id ? "⟳ Syncing..." : "⟳ Sync"}
                </button>
                <button
                  className="remove-btn"
                  onClick={() => onRemoveSource(source.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sync-info-box">
        <h4 className="info-title">📌 How to get your iCal URL</h4>
        <div className="platform-instructions">
          <div className="instruction">
            <strong>Airbnb:</strong> Listing → Availability → Sync Calendars → Export Calendar
          </div>
          <div className="instruction">
            <strong>Booking.com:</strong> Property → Calendar → Sync → iCal Export
          </div>
          <div className="instruction">
            <strong>VRBO:</strong> Dashboard → Calendars → Export → Copy Link
          </div>
        </div>
      </div>

      <style jsx>{`
        .calendar-sync {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .section-title {
          font-size: 22px;
          font-weight: 700;
          color: #e8e3d9;
          margin: 0 0 6px;
        }
        .section-desc {
          font-size: 13px;
          color: #5a6080;
          margin: 0;
          max-width: 480px;
        }
        .btn-primary {
          padding: 10px 18px;
          background: #81B29A;
          border: none;
          border-radius: 8px;
          color: #0f1117;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary {
          padding: 10px 18px;
          background: none;
          border: 1px solid #2a3050;
          border-radius: 8px;
          color: #5a6080;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
        }
        .empty-calendar {
          background: #161924;
          border: 1px dashed #2a3050;
          border-radius: 12px;
          padding: 48px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-icon { font-size: 40px; }
        .empty-title { font-size: 16px; font-weight: 600; color: #c8c3b8; margin: 0; }
        .empty-desc { font-size: 13px; color: #5a6080; max-width: 360px; margin: 0; line-height: 1.6; }
        .add-form-card {
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-title { font-size: 15px; font-weight: 600; color: #e8e3d9; margin: 0; }
        .form-label { font-size: 12px; color: #5a6080; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 8px; }
        .platform-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .platform-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 6px;
          color: #8a9080;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .platform-btn.selected { color: inherit; }
        .form-input {
          width: 100%;
          padding: 10px 12px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 8px;
          color: #e8e3d9;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
        }
        .form-input:focus { border-color: #81B29A; }
        .form-hint { font-size: 11px; color: #4a5068; margin: 6px 0 0; }
        .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .form-row { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; }
        .sources-list { display: flex; flex-direction: column; gap: 10px; }
        .source-card {
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .source-platform-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .platform-name { font-size: 12px; font-weight: 600; }
        .source-info { flex: 1; min-width: 0; }
        .source-url {
          font-size: 12px;
          color: #5a6080;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        .source-meta { display: flex; align-items: center; gap: 6px; }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .status-dot.synced { background: #81B29A; }
        .status-dot.error { background: #E07A5F; }
        .status-dot.pending { background: #F2CC8F; }
        .status-text { font-size: 11px; color: #4a5068; }
        .source-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .sync-btn {
          padding: 6px 12px;
          background: #1e2130;
          border: 1px solid #2a3050;
          border-radius: 6px;
          color: #81B29A;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .sync-btn.syncing {
          opacity: 0.6;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .remove-btn {
          padding: 6px 10px;
          background: none;
          border: 1px solid #2a3050;
          border-radius: 6px;
          color: #4a5068;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .remove-btn:hover { border-color: #E07A5F; color: #E07A5F; }
        .sync-info-box {
          background: #111520;
          border: 1px solid #1e2130;
          border-radius: 10px;
          padding: 16px 20px;
        }
        .info-title { font-size: 13px; color: #c8c3b8; margin: 0 0 12px; font-weight: 600; }
        .platform-instructions { display: flex; flex-direction: column; gap: 8px; }
        .instruction { font-size: 12px; color: #5a6080; line-height: 1.5; }
        .instruction strong { color: #8a9080; }
      `}</style>
    </div>
  );
}
