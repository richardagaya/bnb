import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import {
  formatResendError,
  getAppUrl,
  getResendApiKey,
  getResendFrom,
  getResendFromDomain,
  getResendReplyTo,
} from "@/lib/emailConfig";
import { buildGoogleSignInReminderEmail, buildPasswordResetEmail } from "@/lib/passwordResetEmail";

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

    let auth;
    try {
      auth = getAdminAuth();
    } catch (err) {
      console.error("[send-password-reset] Firebase Admin init failed:", err);
      return NextResponse.json(
        { error: "Password reset is not configured on the server. Please contact support." },
        { status: 500 }
      );
    }

    const appUrl = getAppUrl();
    const continueUrl = `${appUrl}/reset-password`;
    const resend = new Resend(apiKey);
    const replyTo = getResendReplyTo();
    const from = getResendFrom();
    const sendOpts = { from, ...(replyTo ? { replyTo } : {}) };

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(trimmed);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/user-not-found") {
        return NextResponse.json({ ok: true });
      }
      console.error("[send-password-reset] getUserByEmail error:", err);
      return NextResponse.json({ error: "Could not verify account." }, { status: 500 });
    }

    const hasPasswordProvider = userRecord.providerData.some((p) => p.providerId === "password");

    // Google (or other OAuth) accounts have no password — send a helpful sign-in email instead
    if (!hasPasswordProvider) {
      const { error } = await resend.emails.send({
        ...sendOpts,
        to: trimmed,
        subject: "How to sign in to your Tractar account",
        html: buildGoogleSignInReminderEmail(appUrl),
      });

      if (error) {
        console.error(
          "[send-password-reset] Resend error (Google reminder):",
          error.message,
          "| from domain:",
          getResendFromDomain()
        );
        return NextResponse.json(
          { error: formatResendError(error.message, getResendFromDomain()) },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    let resetLink: string;
    try {
      const firebaseLink = await auth.generatePasswordResetLink(trimmed, {
        url: continueUrl,
        handleCodeInApp: true,
      });
      resetLink = toAppResetLink(firebaseLink, continueUrl);
    } catch (err: unknown) {
      if (isEmailNotFoundError(err)) {
        return NextResponse.json({ ok: true });
      }
      console.error("[send-password-reset] generatePasswordResetLink error:", err);
      return NextResponse.json({ error: "Could not create reset link." }, { status: 500 });
    }

    const { error } = await resend.emails.send({
      ...sendOpts,
      to: trimmed,
      subject: "Reset your Tractar password",
      html: buildPasswordResetEmail(resetLink, appUrl),
    });

    if (error) {
      console.error("[send-password-reset] Resend error:", error.message, "| from domain:", getResendFromDomain());
      return NextResponse.json(
        { error: formatResendError(error.message, getResendFromDomain()) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-password-reset] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 });
  }
}

function isEmailNotFoundError(err: unknown): boolean {
  const code = (err as { code?: string }).code ?? "";
  if (code === "auth/user-not-found" || code === "auth/email-not-found") return true;
  const msg = String((err as { message?: string }).message ?? "");
  return msg.includes("EMAIL_NOT_FOUND");
}

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
    /* fallback */
  }
  return firebaseLink;
}
