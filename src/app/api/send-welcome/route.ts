import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  formatResendError,
  getAppUrl,
  getResendApiKey,
  getResendFrom,
  getResendFromDomain,
  getResendReplyTo,
} from "@/lib/emailConfig";

const APP_URL = getAppUrl();

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const apiKey = getResendApiKey();
    if (!apiKey) {
      console.error("[send-welcome] Missing RESEND_API_KEY");
      return NextResponse.json({ error: "Email service is not configured" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const firstName = (name ?? email.split("@")[0]).split(" ")[0];
    const replyTo = getResendReplyTo();
    const from = getResendFrom();

    const { error } = await resend.emails.send({
      from,
      to: email,
      ...(replyTo ? { replyTo } : {}),
      subject: `Welcome to Tracktar, ${firstName} 👋`,
      html: buildWelcomeEmail(firstName, APP_URL),
    });

    if (error) {
      console.error("[send-welcome] Resend error:", error.message, "| from domain:", getResendFromDomain());
      return NextResponse.json(
        { error: formatResendError(error.message, getResendFromDomain()) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-welcome] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

function buildWelcomeEmail(firstName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Tracktar</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #ffffff; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    a { text-decoration: none; }
  </style>
</head>
<body style="background:#ffffff; padding: 32px 16px;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto;">
    <tr><td>

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border:1px solid #e7e5e4; border-bottom:0; border-radius:16px 16px 0 0; padding:32px 40px;">
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px; height:40px; background:#3d6b56;
                  border-radius:10px; text-align:center; vertical-align:middle;">
                  <span style="font-size:18px; font-weight:800; color:#fff; line-height:40px;">T</span>
                </td>
                <td style="padding-left:12px; font-size:20px; font-weight:700; color:#1c1917; letter-spacing:-0.02em;">
                  Tracktar
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Hero -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border-left:1px solid #e7e5e4; border-right:1px solid #e7e5e4; padding:40px 40px 32px;">
        <tr>
          <td>
            <p style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;
              color:#3d6b56; margin-bottom:12px;">Welcome aboard</p>
            <h1 style="font-size:30px; font-weight:800; color:#1c1917; line-height:1.2;
              letter-spacing:-0.025em; margin-bottom:16px;">
              Hey ${firstName}, your dashboard<br/>is ready 🎉
            </h1>
            <p style="font-size:15px; color:#57534e; line-height:1.65; margin-bottom:28px;">
              You've just unlocked a smarter way to manage your rental properties.
              Here's a quick walkthrough to get the most out of Tracktar in the next 5 minutes.
            </p>
            <a href="${appUrl}/dashboard"
              style="display:inline-block; padding:14px 28px; background:#3d6b56;
                color:#ffffff; font-size:15px; font-weight:700; border-radius:10px;
                text-decoration:none;">
              Open my dashboard →
            </a>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border-left:1px solid #e7e5e4; border-right:1px solid #e7e5e4; padding:0 40px;">
        <tr><td style="border-top:1px solid #e7e5e4; height:1px;"></td></tr>
      </table>

      <!-- Steps heading -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border-left:1px solid #e7e5e4; border-right:1px solid #e7e5e4; padding:32px 40px 8px;">
        <tr>
          <td>
            <p style="font-size:11px; font-weight:700; text-transform:uppercase;
              letter-spacing:0.1em; color:#78716c; margin-bottom:6px;">Getting started</p>
            <h2 style="font-size:18px; font-weight:700; color:#1c1917; letter-spacing:-0.02em;">
              5 steps to your first profit report
            </h2>
          </td>
        </tr>
      </table>

      <!-- Step 1 -->
      ${step("1", "Add your property", "Go to Settings in the sidebar, give your rental a name, address and type (apartment, villa, studio…). Each property gets its own isolated dashboard.", `${appUrl}/dashboard`)}

      <!-- Step 2 -->
      ${step("2", "Set up your financials", "Open the Financials tab. Enter your monthly rent, utilities, and cleaner fees — these become the fixed cost baseline for every P&amp;L calculation.", `${appUrl}/dashboard`)}

      <!-- Step 3 -->
      ${step("3", "Log your first booking", "Click the Bookings tab then + Add Booking. Enter the guest name, check-in/out dates, charge amount and payment status. Revenue is tracked the moment you save.", `${appUrl}/dashboard`)}

      <!-- Step 4 -->
      ${step("4", "Track your expenses", "Head to the Expenses tab to record any one-off or recurring costs — repairs, supplies, platform fees. These flow straight into your monthly profit.", `${appUrl}/dashboard`)}

      <!-- Step 5 -->
      ${step("5", "View your P&L Summary", "The Summary tab shows your complete month-by-month profit history — revenue collected, costs, and net profit — all calculated automatically.", `${appUrl}/dashboard`)}

      <!-- Bonus: Referrals -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border-left:1px solid #e7e5e4; border-right:1px solid #e7e5e4; padding:8px 40px 32px;">
        <tr>
          <td style="background:#f4faf6; border:1px solid #d5e8dc;
            border-radius:12px; padding:20px 24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:20px; padding-right:14px; vertical-align:top;">🤝</td>
                <td>
                  <p style="font-size:14px; font-weight:700; color:#1c1917; margin-bottom:6px;">
                    Bonus: Track referral commissions
                  </p>
                  <p style="font-size:13px; color:#57534e; line-height:1.6;">
                    When you're fully booked and send a guest to another unit, log the referral
                    in the <strong style="color:#1c1917;">Referrals tab</strong> and track the commission
                    you earn. It's included automatically in your revenue.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border-left:1px solid #e7e5e4; border-right:1px solid #e7e5e4; padding:0 40px;">
        <tr><td style="border-top:1px solid #e7e5e4; height:1px;"></td></tr>
      </table>

      <!-- CTA footer -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border:1px solid #e7e5e4; border-top:0; padding:32px 40px; border-radius:0 0 16px 16px;">
        <tr>
          <td style="text-align:center;">
            <p style="font-size:14px; color:#57534e; margin-bottom:20px;">
              Any questions? Just reply to this email — we read every one.
            </p>
            <a href="${appUrl}/dashboard"
              style="display:inline-block; padding:13px 32px; background:#ffffff;
                border:1.5px solid #e7e5e4; color:#1c1917; font-size:14px;
                font-weight:600; border-radius:10px; text-decoration:none;">
              Go to dashboard
            </a>
          </td>
        </tr>
      </table>

      <!-- Email footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0 0;">
        <tr>
          <td style="text-align:center;">
            <p style="font-size:12px; color:#a8a29e; line-height:1.6;">
              You received this because you created a Tracktar account.<br/>
              <a href="${appUrl}" style="color:#78716c; text-decoration:underline;">Tracktar</a>
              · Property management made simple.
            </p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>

</body>
</html>`;
}

function step(num: string, title: string, desc: string, link: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background:#ffffff; border-left:1px solid #e7e5e4; border-right:1px solid #e7e5e4; padding:12px 40px;">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0"
          style="border:1px solid #e7e5e4; border-radius:12px; padding:20px 22px; background:#ffffff;">
          <tr>
            <td style="width:36px; vertical-align:top; padding-right:16px;">
              <div style="width:36px; height:36px; background:#eef6f1;
                border:1px solid #d5e8dc; border-radius:8px; text-align:center;
                line-height:36px; font-size:14px; font-weight:800; color:#3d6b56;">
                ${num}
              </div>
            </td>
            <td>
              <p style="font-size:15px; font-weight:700; color:#1c1917; margin-bottom:6px;">
                ${title}
              </p>
              <p style="font-size:13px; color:#57534e; line-height:1.6; margin-bottom:10px;">
                ${desc}
              </p>
              <a href="${link}" style="font-size:12px; font-weight:600;
                color:#3d6b56; text-decoration:none;">
                Do this now →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}
