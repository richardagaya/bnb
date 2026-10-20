"use client";

import Link from "next/link";
import { NavAccount } from "@/app/components/NavAccount";
import { useEffect, useMemo, useState } from "react";
import { fetchReportedContacts } from "@/lib/reportedContactsStore";
import {
  digitsOnly,
  formatPhone,
  numbersMatch,
  type ReportedContact,
  type ReportedRole,
} from "@/data/reportedContacts";

type RoleFilter = "all" | ReportedRole;

const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "agent", label: "Agents" },
  { id: "host", label: "Hosts" },
];

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function VerifyPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [remote, setRemote] = useState<ReportedContact[]>([]);
  const [listError, setListError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchReportedContacts()
        .then((result) => {
          if (cancelled) return;
          setRemote(result.contacts);
          setListError(
            result.configured
              ? ""
              : "The Google Sheet is not connected yet.",
          );
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setListError(err instanceof Error ? err.message : "The list could not be loaded.");
          }
        });
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const digits = digitsOnly(query);
  const searching = digits.length > 0;
  const decisive = digits.length >= 7;

  const contacts = remote;

  const results = useMemo(() => {
    return contacts.filter((contact) => {
      // A full number always searches the whole list, so a role chip cannot hide a match.
      if (!decisive && role !== "all" && contact.role !== role) return false;
      return numbersMatch(query, contact.phone);
    }).sort((a, b) => b.reportedOn.localeCompare(a.reportedOn));
  }, [contacts, query, role, decisive]);

  const listedCount =
    role === "all" ? contacts.length : contacts.filter((contact) => contact.role === role).length;

  return (
    <>
      <style>{CSS}</style>

      <header className="vf-header">
        <div className="vf-header-inner">
          <Link href="/" className="vf-logo">
            <img src="/logo.png" alt="Tracktar" className="vf-logo-img" />
          </Link>
          <nav className="vf-nav">
            <Link href="/">Home</Link>
            <Link href="/tools">Tools</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/verify" className="vf-nav-current" aria-current="page">
              Verify
            </Link>
            <NavAccount />
          </nav>
        </div>
      </header>

      <main className="vf-main">
        <section className="vf-hero">
          <p className="vf-kicker">Community check</p>
          <h1>Verify a  Con!</h1>
          <p className="vf-lead">
            Search phone numbers reported as con agents or hosts. Paste the number
            to verif if the number is a con agent or host.
          </p>
        </section>

        <section className="vf-search-wrap">
          <label className="vf-search" htmlFor="verify-search">
            <span className="vf-search-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12.2 12.2 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <input
              id="verify-search"
              type="search"
              inputMode="tel"
              autoComplete="off"
              autoFocus
              placeholder="Paste a phone number, e.g. 0712 345 678"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="vf-clear" onClick={() => setQuery("")}>
                Clear
              </button>
            )}
          </label>

          <div className="vf-filters" role="tablist" aria-label="Filter by role">
            {ROLE_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={role === item.id}
                className={`vf-chip${role === item.id ? " vf-chip--on" : ""}`}
                onClick={() => setRole(item.id)}
              >
                {item.label}
              </button>
            ))}
            <span className="vf-count">
              {listedCount} {listedCount === 1 ? "number" : "numbers"} listed
            </span>
          </div>
        </section>

        {listError && <p className="vf-err">{listError}</p>}

        <section className="vf-results" aria-live="polite">
          {searching && decisive && (
            <div className={`vf-verdict${results.length ? " vf-verdict--hit" : " vf-verdict--miss"}`}>
              <p className="vf-verdict-title">
                {results.length
                  ? `${results.length} ${results.length === 1 ? "match" : "matches"} on this list`
                  : "This number is not on the list"}
              </p>
              <p className="vf-verdict-sub">
                {results.length
                  ? "A match means the community reported this number. It is not a legal finding."
                  : "No report uses this number. That only means it has not been added here."}
              </p>
            </div>
          )}

          {results.length === 0 && !decisive && (
            <div className="vf-empty">
              <p>
                {contacts.length === 0
                  ? "No numbers have been added yet."
                  : searching
                    ? "Keep typing. A full number shows a clear match or a clear miss."
                    : "Nothing in this filter yet."}
              </p>
            </div>
          )}

          {results.length > 0 && (
            <ul className="vf-list">
              {results.map((contact) => (
                <li key={contact.id} className="vf-card">
                  <div className="vf-card-top">
                    <p className="vf-phone">{formatPhone(contact.phone)}</p>
                    <span className={`vf-role vf-role--${contact.role}`}>
                      {contact.role === "agent" ? "Agent" : "Host"}
                    </span>
                  </div>
                  {contact.note && <p className="vf-note">{contact.note}</p>}
                  <p className="vf-meta">
                    {contact.area && <span>{contact.area}</span>}
                    {contact.area && <span aria-hidden="true">·</span>}
                    {contact.reportedOn && <span>Reported {formatDate(contact.reportedOn)}</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:    #0b0c10;
    --bg2:   #111318;
    --bg3:   #181a21;
    --bd:    rgba(255,255,255,0.07);
    --bd2:   rgba(255,255,255,0.13);
    --text:  #e8e6df;
    --muted: #7a7d8a;
    --faint: #3a3d4a;
    --sage:  #81B29A;
    --coral: #E07A5F;
    --sans:  'Geist', system-ui, sans-serif;
  }

  body { font-family: var(--sans); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
  a { text-decoration: none; color: inherit; }

  .vf-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(11,12,16,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--bd);
    padding: 0 48px; height: 68px;
    display: flex; align-items: center;
  }
  .vf-header-inner {
    max-width: 1100px; margin: 0 auto; width: 100%;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .vf-logo { display: flex; align-items: center; flex-shrink: 0; }
  .vf-logo-img { height: 48px; width: auto; filter: brightness(0.9) saturate(0.8); }
  .vf-nav { display: flex; align-items: center; gap: 28px; }
  .vf-nav a { font-size: 13px; color: var(--muted); transition: color 0.15s; }
  .vf-nav a:hover { color: var(--text); }
  .vf-nav-current { color: var(--text) !important; font-weight: 600; }
  .vf-nav-cta {
    background: var(--sage); color: #0b0c10 !important;
    padding: 8px 16px; border-radius: 8px; font-weight: 500;
  }
  .vf-nav-cta:hover { opacity: 0.88; color: #0b0c10 !important; }

  .vf-main { max-width: 760px; margin: 0 auto; padding: 56px 24px 96px; }
  .vf-kicker {
    font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--sage); font-weight: 600; margin-bottom: 10px;
  }
  .vf-hero h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: clamp(40px, 6vw, 64px); font-weight: 400; line-height: 0.95;
    margin-bottom: 14px;
  }
  .vf-lead { font-size: 16px; line-height: 1.6; color: var(--muted); max-width: 38rem; }

  .vf-search-wrap { margin-top: 32px; position: sticky; top: 80px; z-index: 20; }
  .vf-search {
    display: flex; align-items: center; gap: 10px;
    background: var(--bg2); border: 1px solid var(--bd2);
    border-radius: 14px; padding: 6px 8px 6px 16px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.28);
  }
  .vf-search:focus-within { border-color: var(--sage); }
  .vf-search-icon { color: var(--muted); display: flex; }
  .vf-search input {
    flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
    color: var(--text); font: inherit; font-size: 16px; padding: 14px 0;
  }
  .vf-search input::placeholder { color: var(--faint); }
  .vf-clear {
    border: 0; background: var(--bg3); color: var(--muted);
    font: inherit; font-size: 12px; font-weight: 600;
    border-radius: 8px; padding: 8px 12px; cursor: pointer;
  }
  .vf-clear:hover { color: var(--text); }

  .vf-filters { display: flex; align-items: center; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .vf-chip {
    border: 1px solid var(--bd); background: transparent; color: var(--muted);
    font: inherit; font-size: 13px; border-radius: 999px; padding: 6px 12px; cursor: pointer;
  }
  .vf-chip--on { background: var(--text); color: #0b0c10; border-color: var(--text); }
  .vf-count { margin-left: auto; font-size: 12px; color: var(--faint); }
  .vf-err { margin-top: 16px; font-size: 13px; color: var(--coral); }

  .vf-results { margin-top: 28px; }
  .vf-verdict { border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; border: 1px solid var(--bd); }
  .vf-verdict--hit { background: rgba(224,122,95,0.12); border-color: rgba(224,122,95,0.35); }
  .vf-verdict--miss { background: rgba(129,178,154,0.1); border-color: rgba(129,178,154,0.3); }
  .vf-verdict-title { font-size: 16px; font-weight: 650; margin-bottom: 4px; }
  .vf-verdict-sub { font-size: 13px; line-height: 1.5; color: var(--muted); }

  .vf-empty {
    border: 1px dashed var(--bd2); border-radius: 14px; padding: 28px 18px;
    color: var(--muted); font-size: 14px; line-height: 1.6; text-align: center;
  }
  .vf-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .vf-card {
    background: var(--bg2); border: 1px solid var(--bd); border-radius: 14px; padding: 16px 18px;
  }
  .vf-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .vf-phone {
    font-size: 20px; font-weight: 650; letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
  }
  .vf-role {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    border-radius: 999px; padding: 4px 8px; flex-shrink: 0;
  }
  .vf-role--agent { background: rgba(224,122,95,0.16); color: #E07A5F; }
  .vf-role--host { background: rgba(242,204,143,0.16); color: #F2CC8F; }
  .vf-note { margin-top: 8px; font-size: 14px; line-height: 1.5; color: #c8c5bd; }
  .vf-meta { margin-top: 10px; display: flex; gap: 8px; font-size: 12px; color: var(--muted); }

  @media (max-width: 768px) {
    .vf-header { padding: 0 16px; height: 60px; }
    .vf-logo-img { height: 40px; }
    .vf-nav { gap: 14px; }
    .vf-nav a:not(.vf-nav-cta):not(.vf-nav-current) { display: none; }
    .vf-nav-cta { padding: 7px 12px; font-size: 12px; white-space: nowrap; }
    .vf-main { padding: 32px 16px 72px; }
    .vf-search-wrap { top: 72px; }
    .vf-count { width: 100%; margin-left: 0; }
  }
`;
