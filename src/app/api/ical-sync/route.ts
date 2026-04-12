import { NextRequest, NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ImportedBooking {
  uid: string;
  guestName: string;
  checkIn: string;    // YYYY-MM-DD
  checkOut: string;   // YYYY-MM-DD
  nights: number;
  source: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  paymentStatus: "paid" | "partial" | "unpaid";
  chargeAmount: number;
  discountAmount: number;
  amountPaid: number;
  notes: string;
}

// ── iCal parser ──────────────────────────────────────────────────────────────

/**
 * Unfold continued lines (RFC 5545 §3.1):
 * A CRLF followed immediately by a space or horizontal tab means
 * the next line is a continuation of the current one.
 */
function unfold(raw: string): string {
  return raw.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

/**
 * Parse the VALUE portion of a DTSTART/DTEND line into YYYY-MM-DD.
 * Handles:
 *   - Pure date:     20250415
 *   - UTC datetime:  20250415T120000Z
 *   - Local datetime:20250415T120000
 */
function parseICSDate(raw: string): string | null {
  // Strip everything that isn't a digit (T, Z, hyphens, colons…)
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/** Strip backslash-escaped characters the iCal spec allows: \, \n \N \; \, */
function unescape(s: string): string {
  return s
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function daysBetween(a: string, b: string): number {
  return Math.max(
    0,
    Math.round(
      (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) /
        86_400_000
    )
  );
}

/** Derive a human-readable guest name from SUMMARY. */
function extractGuestName(summary: string): string {
  // Remove trailing "(Airbnb)" style suffixes
  const cleaned = unescape(summary)
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
  return cleaned || "Guest";
}

/** Return true for purely blocking/maintenance events we should skip. */
function isBlockingEvent(guestName: string, summary: string): boolean {
  const low = summary.toLowerCase();
  return (
    low === "reserved" ||
    low === "not available" ||
    low === "blocked" ||
    low.includes("owner stay") ||
    low.includes("maintenance") ||
    low.includes("preparation") ||
    guestName.toLowerCase() === "airbnb (not available)"
  );
}

function parseICS(text: string, platform: string): ImportedBooking[] {
  const lines = unfold(text).split(/\r\n|\n|\r/);
  const bookings: ImportedBooking[] = [];

  let inEvent = false;
  // We store the raw value part (after the first colon) keyed by property name.
  let props: Record<string, string> = {};

  for (const line of lines) {
    const t = line.trimEnd();

    if (t === "BEGIN:VEVENT") {
      inEvent = true;
      props = {};
      continue;
    }

    if (t === "END:VEVENT") {
      inEvent = false;

      const uid      = props["UID"]      ?? "";
      const dtstart  = props["DTSTART"]  ?? "";
      const dtend    = props["DTEND"]    ?? "";
      const summary  = props["SUMMARY"]  ?? "";
      const status   = (props["STATUS"]  ?? "CONFIRMED").toUpperCase();
      const desc     = props["DESCRIPTION"] ?? "";

      // Skip cancelled events
      if (status === "CANCELLED") continue;
      if (!uid || !dtstart || !dtend) continue;

      const checkIn  = parseICSDate(dtstart);
      const checkOut = parseICSDate(dtend);
      if (!checkIn || !checkOut) continue;

      const guestName = extractGuestName(summary);
      if (isBlockingEvent(guestName, summary)) continue;

      const nights = daysBetween(checkIn, checkOut);

      bookings.push({
        uid,
        guestName,
        checkIn,
        checkOut,
        nights,
        source: platform,
        status: "confirmed",
        paymentStatus: "paid",
        chargeAmount: 0,
        discountAmount: 0,
        amountPaid: 0,
        notes: unescape(desc).slice(0, 300),
      });

      continue;
    }

    if (!inEvent) continue;

    // Parse "PROP-NAME;param;param:VALUE"
    const colonIdx = t.indexOf(":");
    if (colonIdx < 0) continue;
    const propKey   = t.slice(0, colonIdx).split(";")[0].toUpperCase();
    const propValue = t.slice(colonIdx + 1);
    props[propKey]  = propValue;
  }

  return bookings;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let url: string, platform: string;

  try {
    ({ url, platform } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Basic URL safety check
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https URLs allowed" }, { status: 400 });
  }

  // Fetch the iCal file from the server (no CORS issues here)
  let icsText: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "BnBTracker-CalendarSync/1.0",
        Accept: "text/calendar, */*",
      },
      signal: AbortSignal.timeout(12_000),
      // Next.js: don't cache — always fresh
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Platform returned HTTP ${res.status}. Check the URL is still valid.` },
        { status: 502 }
      );
    }

    icsText = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Could not reach the iCal URL: ${msg}` },
      { status: 502 }
    );
  }

  if (!icsText.includes("BEGIN:VCALENDAR")) {
    return NextResponse.json(
      { error: "The URL did not return a valid iCal file. Make sure you copied the export/iCal URL, not the page URL." },
      { status: 422 }
    );
  }

  const bookings = parseICS(icsText, platform ?? "Other");

  return NextResponse.json({ bookings, count: bookings.length });
}
