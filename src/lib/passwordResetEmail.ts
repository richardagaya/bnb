export function buildPasswordResetEmail(resetLink: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your Tracktar password</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#ffffff;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
        <tr><td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #e7e5e4;">
                <span style="font-size:20px;font-weight:700;color:#1c1917;letter-spacing:-0.02em;">Tracktar</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#3d6b56;">
                  Password reset
                </p>
                <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#1c1917;line-height:1.25;letter-spacing:-0.02em;">
                  Reset your password
                </h1>
                <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.65;">
                  We received a request to reset the password for your Tracktar account.
                  Click the button below to choose a new password. This link expires in one hour.
                </p>
                <a href="${resetLink}"
                  style="display:inline-block;padding:14px 28px;background:#3d6b56;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                  Reset password
                </a>
                <p style="margin:24px 0 0;font-size:13px;color:#78716c;line-height:1.6;">
                  If you didn&apos;t request this, you can safely ignore this email. Your password won&apos;t change.
                </p>
                <p style="margin:16px 0 0;font-size:12px;color:#a8a29e;line-height:1.6;word-break:break-all;">
                  Button not working? Copy this link:<br/>
                  <a href="${resetLink}" style="color:#3d6b56;">${resetLink}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e7e5e4;text-align:center;">
                <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">
                  <a href="${appUrl}" style="color:#78716c;text-decoration:underline;">tracktar.com</a>
                  · Short-term rental intelligence
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

export function buildGoogleSignInReminderEmail(appUrl: string): string {
  const loginUrl = `${appUrl}/login`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to Tracktar</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#ffffff;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
        <tr><td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #e7e5e4;">
                <span style="font-size:20px;font-weight:700;color:#1c1917;letter-spacing:-0.02em;">Tracktar</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#3d6b56;">
                  Account access
                </p>
                <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#1c1917;line-height:1.25;letter-spacing:-0.02em;">
                  Your account uses Google sign-in
                </h1>
                <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.65;">
                  We received a password reset request for this email, but your Tracktar account
                  was created with <strong style="color:#1c1917;">Sign in with Google</strong> —
                  there is no separate password to reset.
                </p>
                <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.65;">
                  To access your dashboard, open the login page and choose <strong style="color:#1c1917;">Google</strong>
                  using the same email address you used when you signed up.
                </p>
                <a href="${loginUrl}"
                  style="display:inline-block;padding:14px 28px;background:#3d6b56;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                  Go to sign in
                </a>
                <p style="margin:24px 0 0;font-size:13px;color:#78716c;line-height:1.6;">
                  If you didn&apos;t request this, you can ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e7e5e4;text-align:center;">
                <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">
                  <a href="${appUrl}" style="color:#78716c;text-decoration:underline;">tracktar.com</a>
                  · Short-term rental intelligence
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
