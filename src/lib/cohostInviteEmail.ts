import { getAppUrl } from "./emailConfig";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function cohostAcceptPath(token: string): string {
  return `/cohost/accept?token=${encodeURIComponent(token)}`;
}

/** Login link that returns the person to the accept page after they sign in or sign up. */
export function cohostInviteLink(token: string): string {
  const next = cohostAcceptPath(token);
  return `${getAppUrl()}/login?redirect=${encodeURIComponent(next)}`;
}

export function buildCohostInviteEmail(input: {
  hostName: string;
  listingName: string;
  acceptUrl: string;
}): string {
  const hostName = escapeHtml(input.hostName);
  const listingName = escapeHtml(input.listingName);
  const acceptUrl = escapeHtml(input.acceptUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to cohost on Tracktar</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
        <tr><td style="background:#0f1219;border:1px solid #1e2130;border-radius:16px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #1e2130;">
                <span style="font-size:20px;font-weight:700;color:#e8e3d9;letter-spacing:-0.02em;">Tracktar</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#81b29a;">
                  Cohost invite
                </p>
                <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#e8e3d9;line-height:1.25;letter-spacing:-0.02em;">
                  ${hostName} invited you to ${listingName}
                </h1>
                <p style="margin:0 0 24px;font-size:15px;color:#8a91a8;line-height:1.65;">
                  You'll share this property's bookings, calendar, and expenses.
                  Bookings and expenses either of you add show up for both of you.
                  Summary is view only. The rest of the host dashboard stays with ${hostName}.
                </p>
                <a href="${acceptUrl}"
                  style="display:inline-block;padding:14px 28px;background:#81b29a;color:#0c0e14;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                  Accept invite
                </a>
                <p style="margin:24px 0 0;font-size:13px;color:#5a6080;line-height:1.6;">
                  Sign in with this email address. If you don't have a Tracktar account yet, create one from the same page.
                </p>
                <p style="margin:16px 0 0;font-size:12px;color:#3a4060;line-height:1.6;word-break:break-all;">
                  Button not working? Copy this link:<br/>
                  ${acceptUrl}
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
