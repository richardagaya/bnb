import { NextResponse } from "next/server";
import { loadSheetContacts } from "@/lib/sheetContacts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { contacts, configured } = await loadSheetContacts();
    const sorted = [...contacts].sort((a, b) => b.reportedOn.localeCompare(a.reportedOn));
    return NextResponse.json({ contacts: sorted, configured });
  } catch (err) {
    console.error("[reported-contacts] sheet read failed:", err);
    const message = err instanceof Error ? err.message : "Could not load the list.";
    return NextResponse.json({ contacts: [], configured: true, error: message }, { status: 502 });
  }
}
