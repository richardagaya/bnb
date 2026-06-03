import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getAppUrl, getResendApiKey, getResendFrom, getResendReplyTo } from "@/lib/emailConfig";
import { buildPasswordResetEmail } from "@/lib/passwordResetEmail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const trimmed = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const apiKey = getResendApiKey();
    if (!apiKey) {
      console.error("[send-password-reset] Missing RESEND_API_KEY");
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }

    const appUrl = getAppUrl().replace(/\/$/, "");
    const continueUrl = `${appUrl}/reset-password`;

    let resetLink: string;
    try {
      const firebaseLink = await getAdminAuth().generatePasswordResetLink(trimmed, {
        url: continueUrl,
        handleCodeInApp: true,
      });
      resetLink = toAppResetLink(firebaseLink, continueUrl);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      // Don't reveal whether the account exists
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        return NextResponse.json({ ok: true });
      }
      console.error("[send-password-reset] Firebase Admin error:", err);
      return NextResponse.json({ error: "Could not create reset link." }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const replyTo = getResendReplyTo();

    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: trimmed,
      ...(replyTo ? { replyTo } : {}),
      subject: "Reset your Tractar password",
      html: buildPasswordResetEmail(resetLink, appUrl),
    });

    if (error) {
      console.error("[send-password-reset] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-password-reset] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 });
  }
}

/** Use tracktar.com in the email instead of firebaseapp.com when possible. */
function toAppResetLink(firebaseLink: string, continueUrl: string): string {
  try {
    const parsed = new URL(firebaseLink);
    const mode = parsed.searchParams.get("mode");
    const oobCode = parsed.searchParams.get("oobCode");
    if (mode && oobCode) {
      const app = new URL(continueUrl);
      app.searchParams.set("mode", mode);
      app.searchParams.set("oobCode", oobCode);
      const apiKey = parsed.searchParams.get("apiKey");
      if (apiKey) app.searchParams.set("apiKey", apiKey);
      return app.toString();
    }
  } catch {
    /* use firebase link as fallback */
  }
  return firebaseLink;
}
