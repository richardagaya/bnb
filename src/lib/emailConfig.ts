export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tracktar.com").replace(/\/$/, "");
}

export function getResendFrom() {
  return process.env.RESEND_FROM_EMAIL ?? "Tractar <support@tracktar.com>";
}

export function getResendReplyTo() {
  return process.env.RESEND_REPLY_TO ?? undefined;
}

export function getResendApiKey() {
  return process.env.RESEND_API_KEY ?? "";
}
