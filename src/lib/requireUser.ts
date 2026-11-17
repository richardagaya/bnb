import { getAdminAuth } from "./firebaseAdmin";

/** Verify a Firebase ID token from an `Authorization: Bearer` header. */
export async function requireUser(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    return await getAdminAuth().verifyIdToken(match[1]);
  } catch {
    return null;
  }
}
