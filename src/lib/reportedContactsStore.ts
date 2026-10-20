import type { ReportedContact } from "@/data/reportedContacts";

export async function fetchReportedContacts() {
  const res = await fetch("/api/reported-contacts", { cache: "no-store" });
  const data = (await res.json()) as {
    contacts?: ReportedContact[];
    error?: string;
    configured?: boolean;
  };
  if (!res.ok) throw new Error(data.error || "Could not load the list.");
  return {
    contacts: data.contacts ?? [],
    configured: data.configured !== false,
  };
}
