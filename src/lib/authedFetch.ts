import { auth } from "./firebase";

/** POST JSON to an app API route with the signed-in user's ID token. */
export async function authedPost<T = { ok?: boolean; error?: string }>(
  path: string,
  body: unknown
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("You need to be signed in.");

  const res = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}
