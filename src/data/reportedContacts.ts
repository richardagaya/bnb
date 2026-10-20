export type ReportedRole = "agent" | "host";

export type ReportedContact = {
  id: string;
  /** Any common format is fine: 0712…, +254 712…, or with spaces and dashes. */
  phone: string;
  role: ReportedRole;
  /** City or area, when known. */
  area?: string;
  /** Short note on why this number was listed. */
  note: string;
  /** ISO date, YYYY-MM-DD. */
  reportedOn: string;
};

/**
 * Optional seed list. Numbers added from the Verify page are stored
 * separately and shown alongside these.
 */
export const REPORTED_CONTACTS: ReportedContact[] = [];

export type ContactDraft = {
  phone: string;
  role: ReportedRole;
  area?: string;
  note: string;
};

function splitRow(line: string) {
  if (line.includes("\t")) return line.split("\t");
  if (line.includes(";")) return line.split(";");
  if (line.includes(",")) return line.split(",");
  return [line];
}

/** One number per line, or rows of: phone, role, area, note. */
export function parseContactList(
  text: string,
  fallbackRole: ReportedRole,
  fallbackNote: string,
): { contacts: ContactDraft[]; skipped: number } {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const contacts: ContactDraft[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  let start = 0;
  const firstCell = lines[0] ? splitRow(lines[0])[0]?.trim().toLowerCase() : "";
  if (firstCell === "phone" || firstCell.startsWith("phone ") || firstCell === "number" || firstCell === "mobile") start = 1;

  for (const line of lines.slice(start)) {
    const parts = splitRow(line).map((part) => part.trim());
    const phone = parts[0] ?? "";
    const key = matchKey(phone);
    if (key.length < 9 || key.length > 15) {
      skipped += 1;
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);

    const roleCell = (parts[1] ?? "").toLowerCase();
    const role: ReportedRole = roleCell.startsWith("host")
      ? "host"
      : roleCell.startsWith("agent")
        ? "agent"
        : fallbackRole;
    const area = parts[2] || undefined;
    const note = parts.slice(3).join(", ").trim() || fallbackNote.trim();
    contacts.push({ phone, role, area, note });
  }

  return { contacts, skipped };
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Last 9 digits, so 0712… and +254712… are the same number. */
export function matchKey(value: string) {
  const digits = digitsOnly(value);
  if (digits.length >= 9) return digits.slice(-9);
  return digits;
}

export function numbersMatch(query: string, phone: string) {
  const q = matchKey(query);
  if (!q) return true;
  const p = matchKey(phone);
  if (q.length >= 7) return p === q || p.endsWith(q) || q.endsWith(p);
  return p.includes(q);
}

export function formatPhone(phone: string) {
  const digits = digitsOnly(phone);
  if (digits.startsWith("254") && digits.length === 12) {
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone.trim();
}
