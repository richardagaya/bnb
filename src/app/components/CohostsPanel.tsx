"use client";

import { useCallback, useEffect, useState } from "react";
import { authedPost } from "@/lib/authedFetch";
import { getCohosts, type CohostMember } from "@/lib/firestore";

interface CohostsPanelProps {
  hostUid: string;
  listingId: string;
  listingName: string;
}

export default function CohostsPanel({ hostUid, listingId, listingName }: CohostsPanelProps) {
  const [members, setMembers] = useState<CohostMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getCohosts(hostUid, listingId);
      setMembers(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load cohosts.");
    } finally {
      setLoading(false);
    }
  }, [hostUid, listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async () => {
    const next = email.trim();
    if (!next || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await authedPost("/api/cohosts/invite", { listingId, email: next });
      setEmail("");
      setNotice(`Invite sent to ${next}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the invite.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (member: CohostMember) => {
    if (busy) return;
    const label = member.name || member.email;
    if (!window.confirm(`Remove ${label} from ${listingName}?`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await authedPost("/api/cohosts/revoke", { listingId, memberId: member.id });
      setNotice(`${label} no longer has access.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove the cohost.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cohost-panel">
      <div className="cohost-intro">
        <h2>Cohosts</h2>
        <p>
          Invite someone to manage bookings and expenses for {listingName}. They can open
          Bookings, Summary, Calendar, and Expenses. Summary is view only. A booking or
          expense added by either of you shows up for both.
        </p>
      </div>

      <form
        className="cohost-invite"
        onSubmit={(e) => {
          e.preventDefault();
          void invite();
        }}
      >
        <label htmlFor="cohost-email">Email</label>
        <div className="cohost-invite-row">
          <input
            id="cohost-email"
            type="email"
            autoComplete="email"
            placeholder="cohost@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={busy || !email.trim()}>
            {busy ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>

      {error && <p className="cohost-error">{error}</p>}
      {notice && <p className="cohost-notice">{notice}</p>}

      {loading ? (
        <p className="cohost-muted">Loading cohosts…</p>
      ) : members.length === 0 ? (
        <p className="cohost-muted">No cohosts yet.</p>
      ) : (
        <ul className="cohost-list">
          {members.map((member) => (
            <li key={member.id}>
              <div>
                <span className="cohost-name">{member.name || member.email}</span>
                <span className="cohost-email">{member.email}</span>
              </div>
              <div className="cohost-actions">
                <span className={`cohost-status ${member.status}`}>{member.status}</span>
                <button type="button" onClick={() => void revoke(member)} disabled={busy}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .cohost-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 720px;
        }
        .cohost-intro h2 {
          font-size: 20px;
          font-weight: 700;
          color: #e8e3d9;
          margin-bottom: 6px;
        }
        .cohost-intro p,
        .cohost-muted {
          color: #8a91a8;
          font-size: 14px;
          line-height: 1.6;
        }
        .cohost-invite label {
          display: block;
          font-size: 12px;
          color: #8a91a8;
          margin-bottom: 6px;
        }
        .cohost-invite-row {
          display: flex;
          gap: 8px;
        }
        .cohost-invite input {
          flex: 1;
          min-width: 0;
          padding: 10px 12px;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 8px;
          color: #e8e3d9;
          font: inherit;
          font-size: 14px;
        }
        .cohost-invite input:focus {
          outline: none;
          border-color: #81b29a;
        }
        .cohost-invite button,
        .cohost-actions button {
          border: none;
          border-radius: 8px;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .cohost-invite button {
          padding: 10px 16px;
          background: #81b29a;
          color: #0f1117;
        }
        .cohost-invite button:disabled,
        .cohost-actions button:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .cohost-error {
          color: #f08080;
          font-size: 13px;
        }
        .cohost-notice {
          color: #81b29a;
          font-size: 13px;
        }
        .cohost-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 0;
          padding: 0;
        }
        .cohost-list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          background: #161924;
          border: 1px solid #1e2130;
          border-radius: 10px;
        }
        .cohost-name {
          display: block;
          color: #e8e3d9;
          font-size: 14px;
          font-weight: 600;
        }
        .cohost-email {
          display: block;
          color: #6a7088;
          font-size: 12px;
          margin-top: 2px;
          word-break: break-all;
        }
        .cohost-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .cohost-status {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 700;
        }
        .cohost-status.active { color: #81b29a; }
        .cohost-status.pending { color: #f2cc8f; }
        .cohost-actions button {
          padding: 7px 10px;
          background: transparent;
          border: 1px solid #5a3030;
          color: #f08080;
        }
        @media (max-width: 640px) {
          .cohost-invite-row,
          .cohost-list li {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
