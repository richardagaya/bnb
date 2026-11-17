import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { Resend } from "resend";
import { formatCurrency } from "./currency";
import {
  formatResendError,
  getAppUrl,
  getResendApiKey,
  getResendFrom,
  getResendFromDomain,
  getResendReplyTo,
} from "./emailConfig";
import { getAdminFirestore } from "./firebaseAdmin";

export type MonthSummary = {
  stays: number;
  nights: number;
  revenue: number;
  outstanding: number;
  expenses: number;
  fixedCosts: number;
  profit: number;
};

type Loose = Record<string, unknown>;

function amount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function inMonth(value: unknown, month: string): boolean {
  return typeof value === "string" && value.startsWith(month);
}

/** Previous calendar month as `YYYY-MM`, using UTC so the 1st-of-month cron is stable. */
export function previousMonthKey(now = new Date()): string {
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon) return month;
  return new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Same month math as the dashboard summary.
 * Returns null when the listing had no non-cancelled booking in the month.
 */
export function summarizeListingMonth(input: {
  month: string;
  bookings: Loose[];
  expenses: Loose[];
  referrals: Loose[];
  financials: Loose | null;
}): MonthSummary | null {
  const bookings = input.bookings.filter(
    (booking) => booking.status !== "cancelled" && inMonth(booking.checkIn, input.month)
  );
  if (bookings.length === 0) return null;

  const expenses = input.expenses.filter((expense) => inMonth(expense.date, input.month));
  const referrals = input.referrals.filter((referral) => inMonth(referral.date, input.month));
  const revenue =
    bookings.reduce((sum, booking) => sum + amount(booking.amountPaid), 0) +
    referrals.reduce((sum, referral) => sum + amount(referral.commissionReceived), 0);
  const outstanding =
    bookings.reduce(
      (sum, booking) =>
        sum + Math.max(0, amount(booking.chargeAmount) - amount(booking.discountAmount) - amount(booking.amountPaid)),
      0
    ) +
    referrals.reduce(
      (sum, referral) => sum + Math.max(0, amount(referral.commissionAmount) - amount(referral.commissionReceived)),
      0
    );
  const expenseTotal = expenses.reduce((sum, expense) => sum + amount(expense.amount), 0);
  const financials = input.financials ?? {};
  const fixedCosts =
    amount(financials.monthlyRent) + amount(financials.monthlyUtilities) + amount(financials.monthlyCleaner);

  return {
    stays: bookings.length,
    nights: bookings.reduce((sum, booking) => sum + amount(booking.nights), 0),
    revenue,
    outstanding,
    expenses: expenseTotal,
    fixedCosts,
    profit: revenue - fixedCosts - expenseTotal,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function moneyCell(amountValue: number, currency: string, emphasize = false): string {
  const color = emphasize ? (amountValue >= 0 ? "#1f7a4d" : "#c2410c") : "#1c1917";
  return `<td style="padding:8px 0;text-align:right;font-weight:${emphasize ? 700 : 500};color:${color};">${escapeHtml(formatCurrency(amountValue, currency))}</td>`;
}

export function buildMonthlySummaryEmail(input: {
  hostName: string;
  month: string;
  currency: string;
  listings: Array<{ name: string } & MonthSummary>;
  dashboardUrl: string;
}): string {
  const hostName = escapeHtml(input.hostName);
  const label = escapeHtml(monthLabel(input.month));
  const rows = input.listings
    .map((listing) => {
      const name = escapeHtml(listing.name);
      return `<tr><td colspan="2" style="padding:18px 0 8px;font-size:16px;font-weight:700;color:#1c1917;border-top:1px solid #e7e5e4;">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#57534e;">Stays</td><td style="padding:6px 0;text-align:right;color:#1c1917;">${listing.stays}</td></tr>
        <tr><td style="padding:6px 0;color:#57534e;">Nights</td><td style="padding:6px 0;text-align:right;color:#1c1917;">${listing.nights}</td></tr>
        <tr><td style="padding:6px 0;color:#57534e;">Collected</td>${moneyCell(listing.revenue, input.currency)}</tr>
        <tr><td style="padding:6px 0;color:#57534e;">Outstanding</td>${moneyCell(listing.outstanding, input.currency)}</tr>
        <tr><td style="padding:6px 0;color:#57534e;">Expenses</td>${moneyCell(listing.expenses, input.currency)}</tr>
        <tr><td style="padding:6px 0;color:#57534e;">Fixed costs</td>${moneyCell(listing.fixedCosts, input.currency)}</tr>
        <tr><td style="padding:8px 0;color:#1c1917;font-weight:700;">Profit</td>${moneyCell(listing.profit, input.currency, true)}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${label} summary</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#ffffff;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;">
        <tr><td style="padding:28px 32px;border-bottom:1px solid #e7e5e4;">
          <span style="font-size:20px;font-weight:700;color:#1c1917;">Tracktar</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3d6b56;">Monthly summary</p>
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#1c1917;line-height:1.25;">${label}</h1>
          <p style="margin:0 0 8px;font-size:15px;color:#57534e;line-height:1.6;">Hi ${hostName}, here is how your properties with bookings performed.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">${rows}</table>
          <a href="${escapeHtml(input.dashboardUrl)}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#3d6b56;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">Open dashboard</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const CLAIM_STALE_MS = 15 * 60 * 1000;

async function claimSend(db: Firestore, uid: string, month: string): Promise<boolean> {
  const ref = db.doc(`users/${uid}/emailLog/monthly-${month}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const data = snap.data() ?? {};
      if (data.status === "sent") return false;
      if (data.status === "sending") {
        const started = data.startedAt?.toDate?.() as Date | undefined;
        if (started && Date.now() - started.getTime() < CLAIM_STALE_MS) return false;
      }
    }
    tx.set(ref, {
      status: "sending",
      month,
      startedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
}

async function loadListingSummary(
  db: Firestore,
  uid: string,
  listingId: string,
  month: string
): Promise<MonthSummary | null> {
  const [bookingsSnap, expensesSnap, referralsSnap, financialsSnap] = await Promise.all([
    db.collection(`users/${uid}/bookings/${listingId}/items`).get(),
    db.collection(`users/${uid}/expenses/${listingId}/items`).get(),
    db.collection(`users/${uid}/referrals/${listingId}/items`).get(),
    db.doc(`users/${uid}/financials/${listingId}`).get(),
  ]);

  return summarizeListingMonth({
    month,
    bookings: bookingsSnap.docs.map((doc) => doc.data() as Loose),
    expenses: expensesSnap.docs.map((doc) => doc.data() as Loose),
    referrals: referralsSnap.docs.map((doc) => doc.data() as Loose),
    financials: financialsSnap.exists ? (financialsSnap.data() as Loose) : null,
  });
}

export type MonthlyRunResult = {
  month: string;
  sent: number;
  skipped: number;
  failed: number;
};

export async function runMonthlySummaries(month: string): Promise<MonthlyRunResult> {
  const db = getAdminFirestore();
  const apiKey = getResendApiKey();
  if (!apiKey) throw new Error("Email service is not configured");

  const resend = new Resend(apiKey);
  const from = getResendFrom();
  const replyTo = getResendReplyTo();
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const users = await db.collection("users").get();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const userDoc of users.docs) {
    const profile = userDoc.data();
    const email = typeof profile.email === "string" ? profile.email.trim() : "";
    if (!email) {
      skipped += 1;
      continue;
    }

    const listingsSnap = await db.collection(`users/${userDoc.id}/listings`).get();
    const listings: Array<{ name: string } & MonthSummary> = [];
    for (const listingDoc of listingsSnap.docs) {
      const summary = await loadListingSummary(db, userDoc.id, listingDoc.id, month);
      if (!summary) continue;
      const name = String(listingDoc.data().name ?? "Property");
      listings.push({ name, ...summary });
    }

    if (listings.length === 0) {
      skipped += 1;
      continue;
    }

    const claimed = await claimSend(db, userDoc.id, month);
    if (!claimed) {
      skipped += 1;
      continue;
    }

    const hostName = String(profile.name || email.split("@")[0]);
    const currency = typeof profile.currency === "string" && profile.currency ? profile.currency : "KES";
    const logRef = db.doc(`users/${userDoc.id}/emailLog/monthly-${month}`);

    try {
      const { error } = await resend.emails.send({
        from,
        to: email,
        ...(replyTo ? { replyTo } : {}),
        subject: `Your ${monthLabel(month)} Tracktar summary`,
        html: buildMonthlySummaryEmail({
          hostName,
          month,
          currency,
          listings,
          dashboardUrl,
        }),
      });
      if (error) {
        throw new Error(formatResendError(error.message, getResendFromDomain()));
      }
      await logRef.set(
        { status: "sent", month, sentAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      sent += 1;
    } catch (err) {
      console.error(`[monthly-summary] ${userDoc.id}`, err);
      await logRef.set(
        {
          status: "failed",
          month,
          error: err instanceof Error ? err.message : "send failed",
          failedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      failed += 1;
    }
  }

  return { month, sent, skipped, failed };
}
