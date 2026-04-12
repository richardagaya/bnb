/**
 * Firebase Storage helpers for file uploads.
 *
 * Storage paths:
 *   users/{uid}/avatar          – profile photo
 *   listings/{uid}/{listingId}/{filename} – property images / documents
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

export type UploadProgress = {
  progress: number;   // 0–100
  downloadURL: string | null;
  error: Error | null;
  state: "running" | "paused" | "success" | "error" | "idle";
};

// ─── Profile / Avatar ─────────────────────────────────────────────────────────

/**
 * Upload a user's avatar image and return the public download URL.
 * @param uid   Firebase Auth UID
 * @param file  The image File object (jpeg, png, webp etc.)
 * @param onProgress  Optional callback receiving 0–100 progress value
 */
export async function uploadAvatar(
  uid: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const storageRef = ref(storage, `users/${uid}/avatar.${ext}`);
  return uploadWithProgress(storageRef, file, onProgress);
}

/**
 * Delete the user's stored avatar.
 */
export async function deleteAvatar(uid: string, ext = "jpg") {
  const storageRef = ref(storage, `users/${uid}/avatar.${ext}`);
  await deleteObject(storageRef).catch(() => undefined); // ignore not-found
}

// ─── Listing Assets ───────────────────────────────────────────────────────────

/**
 * Upload a file associated with a listing (photo, document, etc.)
 * Returns the public download URL.
 */
export async function uploadListingFile(
  uid: string,
  listingId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const filename = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `listings/${uid}/${listingId}/${filename}`);
  return uploadWithProgress(storageRef, file, onProgress);
}

/**
 * Delete a listing file by its storage path.
 * @param path The full storage path (e.g. "listings/uid/listingId/filename")
 */
export async function deleteListingFile(path: string) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef).catch(() => undefined);
}

/**
 * Get a public download URL for any storage path.
 */
export async function getFileURL(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}

// ─── Internal helper ─────────────────────────────────────────────────────────

function uploadWithProgress(
  storageRef: ReturnType<typeof ref>,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot) => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}
