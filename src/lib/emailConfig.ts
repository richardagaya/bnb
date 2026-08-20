const VERIFIED_SEND_DOMAIN = "tracktar.com";
const DEFAULT_FROM = `Tracktar <support@${VERIFIED_SEND_DOMAIN}>`;

/** Wrong domains that have appeared in env typos — never valid for this project. */
const WRONG_FROM_DOMAINS = ["tractar.app", "tracktar.app", "tractar.com"];

function extractEmailAddress(from: string): string {
  const bracketed = from.match(/<([^>]+)>/);
  if (bracketed) return bracketed[1].trim();
  return from.trim();
}

function normalizeEmailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at === -1) return email;
  const local = email.slice(0, at);
  let domain = email.slice(at + 1).toLowerCase();

  for (const wrong of WRONG_FROM_DOMAINS) {
    if (domain === wrong) {
      console.warn(
        `[email] Correcting sender domain "${wrong}" → "${VERIFIED_SEND_DOMAIN}" (check RESEND_FROM_EMAIL in Vercel)`
      );
      domain = VERIFIED_SEND_DOMAIN;
      break;
    }
  }

  return `${local}@${domain}`;
}

function normalizeFromHeader(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_FROM;

  const email = normalizeEmailDomain(extractEmailAddress(trimmed));

  if (trimmed.includes("<")) {
    const name = trimmed.slice(0, trimmed.indexOf("<")).trim() || "Tracktar";
    return `${name} <${email}>`;
  }

  return `Tracktar <${email}>`;
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tracktar.com").replace(/\/$/, "");
}

export function getResendFrom(): string {
  const raw = process.env.RESEND_FROM_EMAIL;
  if (raw && WRONG_FROM_DOMAINS.some((d) => raw.toLowerCase().includes(`@${d}`))) {
    console.warn(
      `[email] RESEND_FROM_EMAIL uses a wrong domain. Raw value starts with: ${raw.slice(0, 40)}… — using ${VERIFIED_SEND_DOMAIN}`
    );
  }
  return normalizeFromHeader(raw ?? DEFAULT_FROM);
}

export function getResendFromDomain(): string {
  return extractEmailAddress(getResendFrom()).split("@")[1] ?? VERIFIED_SEND_DOMAIN;
}

export function getResendReplyTo(): string | undefined {
  const raw = process.env.RESEND_REPLY_TO?.trim();
  if (!raw) return undefined;
  return normalizeEmailDomain(raw);
}

export function getResendApiKey() {
  return process.env.RESEND_API_KEY ?? "";
}

/** User-friendly Resend errors (domain mismatch is the common production issue). */
export function formatResendError(message: string, fromDomain: string): string {
  if (message.includes("domain is not verified") || message.includes("not verified")) {
    return (
      `Email could not be sent: the sender domain "${fromDomain}" is not verified in Resend. ` +
      `Set RESEND_FROM_EMAIL to an address @${VERIFIED_SEND_DOMAIN} in Vercel and redeploy.`
    );
  }
  return message;
}
