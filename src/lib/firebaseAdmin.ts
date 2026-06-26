import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type ServiceAccountFields = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function normalizePrivateKey(raw: string): string {
  return raw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
}

function parseServiceAccountJson(json: string): ServiceAccountFields | null {
  const trimmed = json.trim();
  if (!trimmed.startsWith("{")) return null;

  const serviceAccount = JSON.parse(trimmed) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  return {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: normalizePrivateKey(serviceAccount.private_key),
  };
}

function resolveServiceAccount(): ServiceAccountFields {
  const jsonOrKey = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonOrKey) {
    const fromJson = parseServiceAccountJson(jsonOrKey);
    if (fromJson) return fromJson;

    // User pasted only the private key into FIREBASE_SERVICE_ACCOUNT_JSON
    if (jsonOrKey.includes("BEGIN PRIVATE KEY")) {
      const projectId =
        process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail =
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = normalizePrivateKey(jsonOrKey);

      if (projectId && clientEmail) {
        return { projectId, clientEmail, privateKey };
      }
    }
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY)
    : undefined;

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  throw new Error(
    "Missing Firebase Admin credentials. Use FIREBASE_SERVICE_ACCOUNT_JSON (full JSON file), " +
      "or FIREBASE_ADMIN_PRIVATE_KEY + FIREBASE_ADMIN_CLIENT_EMAIL (+ project id)."
  );
}

function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const { projectId, clientEmail, privateKey } = resolveServiceAccount();

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminAuth() {
  return getAuth(initAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(initAdminApp());
}
