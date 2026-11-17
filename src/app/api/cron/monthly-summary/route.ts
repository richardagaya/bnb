import { NextRequest, NextResponse } from "next/server";
import { previousMonthKey, runMonthlySummaries } from "@/lib/monthlyReport";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Vercel Cron calls this on the 1st. A manual check can pass `?month=YYYY-MM`. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requested = req.nextUrl.searchParams.get("month");
  if (requested && !MONTH_RE.test(requested)) {
    return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
  }

  const month = requested || previousMonthKey();

  try {
    const result = await runMonthlySummaries(month);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[monthly-summary]", err);
    const message = err instanceof Error ? err.message : "Failed to send monthly summaries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
