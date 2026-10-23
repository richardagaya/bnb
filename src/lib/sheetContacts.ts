import { matchKey, type ReportedContact, type ReportedRole } from "@/data/reportedContacts";

const DEFAULT_SHEET_ID = "1zy_VIQsjzIMDBFcV1LgousKLwLosW_s6tSRBazoEHAc";

export function sheetCsvUrl() {
  const direct = process.env.GOOGLE_SHEET_CSV_URL?.trim();
  if (direct) return direct;

  const id = process.env.GOOGLE_SHEET_ID?.trim() || DEFAULT_SHEET_ID;
  const gid = process.env.GOOGLE_SHEET_GID?.trim() || "0";
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

/** Minimal CSV parser that keeps quoted commas inside a cell. */
export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((line) => line.some((value) => value.trim()));
}

function headerIndex(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(header));
}

function roleFrom(value: string): ReportedRole {
  return value.toLowerCase().includes("host") ? "host" : "agent";
}

export function contactsFromCsv(text: string): ReportedContact[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((cell) => cell.trim().toLowerCase());
  const phoneCol = headerIndex(headers, ["phone", "number", "mobile", "phone number"]);
  const hasHeader = phoneCol >= 0;
  const start = hasHeader ? 1 : 0;
  const columns = hasHeader
    ? {
        phone: phoneCol,
        role: headerIndex(headers, ["role", "type"]),
        area: headerIndex(headers, ["area", "city", "location"]),
        note: headerIndex(headers, ["note", "notes", "reason"]),
        date: headerIndex(headers, ["date", "reported", "reportedon", "reported on"]),
      }
    : { phone: 0, role: 1, area: 2, note: 3, date: 4 };

  const byId = new Map<string, ReportedContact>();
  for (const row of rows.slice(start)) {
    const phone = (row[columns.phone] ?? "").trim();
    const id = matchKey(phone);
    if (id.length < 9 || id.length > 15) continue;
    const area = columns.area >= 0 ? (row[columns.area] ?? "").trim() : "";
    const note = columns.note >= 0 ? (row[columns.note] ?? "").trim() : "";
    const reportedOn = columns.date >= 0 ? (row[columns.date] ?? "").trim() : "";
    const roleCell = columns.role >= 0 ? (row[columns.role] ?? "") : "";
    byId.set(id, {
      id,
      phone,
      role: roleFrom(roleCell),
      area: area || undefined,
      note,
      reportedOn,
    });
  }
  return [...byId.values()];
}

const SHEET_REFRESH_MS = 30 * 60 * 1000;

let cachedContacts: ReportedContact[] | null = null;
let cachedAt = 0;

export async function loadSheetContacts() {
  const url = sheetCsvUrl();
  if (!url) {
    return { contacts: [] as ReportedContact[], configured: false };
  }

  if (cachedContacts && Date.now() - cachedAt < SHEET_REFRESH_MS) {
    return { contacts: cachedContacts, configured: true };
  }

  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok || text.trimStart().startsWith("<!")) {
    throw new Error("The Google Sheet could not be read. Share it so anyone with the link can view.");
  }
  cachedContacts = contactsFromCsv(text);
  cachedAt = Date.now();
  return { contacts: cachedContacts, configured: true };
}
