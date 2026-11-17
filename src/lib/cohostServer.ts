import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { buildCohostInviteEmail, cohostInviteLink } from "./cohostInviteEmail";
import {
  formatResendError,
  getResendApiKey,
  getResendFrom,
  getResendFromDomain,
  getResendReplyTo,
} from "./emailConfig";
import { getAdminAuth, getAdminFirestore } from "./firebaseAdmin";

type Failure = { ok: false; status: number; error: string };
type Success = { ok: true; listingName?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function shareId(hostUid: string, listingId: string) {
  return `${hostUid}_${listingId}`;
}

async function sendInviteEmail(input: {
  to: string;
  hostName: string;
  listingName: string;
  token: string;
}) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    throw new Error("Email service is not configured");
  }
  const resend = new Resend(apiKey);
  const replyTo = getResendReplyTo();
  const from = getResendFrom();
  const acceptUrl = cohostInviteLink(input.token);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    ...(replyTo ? { replyTo } : {}),
    subject: `${input.hostName} invited you to cohost ${input.listingName}`,
    html: buildCohostInviteEmail({
      hostName: input.hostName,
      listingName: input.listingName,
      acceptUrl,
    }),
  });
  if (error) {
    throw new Error(formatResendError(error.message, getResendFromDomain()));
  }
}

export async function inviteCohost(input: {
  hostUid: string;
  hostEmail: string;
  listingId: string;
  email: string;
}): Promise<Success | Failure> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, status: 400, error: "Enter a valid email address." };
  }
  if (email === input.hostEmail.trim().toLowerCase()) {
    return { ok: false, status: 400, error: "You can't invite yourself." };
  }

  const db = getAdminFirestore();
  const listingSnap = await db.doc(`users/${input.hostUid}/listings/${input.listingId}`).get();
  if (!listingSnap.exists) {
    return { ok: false, status: 404, error: "Property not found." };
  }

  const listingName = String(listingSnap.data()?.name ?? "your property");
  const hostSnap = await db.doc(`users/${input.hostUid}`).get();
  const hostName = String(hostSnap.data()?.name || input.hostEmail.split("@")[0] || "A host");

  const membersSnap = await db.collection(`users/${input.hostUid}/listings/${input.listingId}/cohosts`).get();
  const existing = membersSnap.docs.find((d) => String(d.data().email ?? "").toLowerCase() === email);
  if (existing?.data()?.status === "active") {
    return { ok: false, status: 409, error: "That person is already a cohost on this property." };
  }

  let cohostUid: string | null = null;
  let cohostName = email.split("@")[0];
  try {
    const account = await getAdminAuth().getUserByEmail(email);
    if (account.uid === input.hostUid) {
      return { ok: false, status: 400, error: "You can't invite yourself." };
    }
    cohostUid = account.uid;
    cohostName = account.displayName || cohostName;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "auth/user-not-found") throw err;
  }

  const token = randomBytes(24).toString("hex");
  const invites = db.collection("cohostInvites");
  const existingInviteId = existing?.data()?.inviteId;
  let inviteId = typeof existingInviteId === "string" ? existingInviteId : "";

  if (inviteId) {
    await invites.doc(inviteId).set(
      {
        email,
        token,
        hostUid: input.hostUid,
        hostName,
        listingId: input.listingId,
        listingName,
        status: "pending",
        cohostUid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    const created = await invites.add({
      email,
      token,
      hostUid: input.hostUid,
      hostName,
      listingId: input.listingId,
      listingName,
      status: "pending",
      cohostUid,
      createdAt: FieldValue.serverTimestamp(),
    });
    inviteId = created.id;
  }

  const memberId = existing?.id ?? cohostUid ?? `invite_${inviteId}`;
  await db.doc(`users/${input.hostUid}/listings/${input.listingId}/cohosts/${memberId}`).set(
    {
      email,
      name: cohostName,
      status: "pending",
      inviteId,
      cohostUid,
      invitedAt: existing?.data()?.invitedAt ?? FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (cohostUid) {
    await db.doc(`users/${cohostUid}/sharedListings/${shareId(input.hostUid, input.listingId)}`).set(
      {
        hostUid: input.hostUid,
        listingId: input.listingId,
        listingName,
        hostName,
        status: "pending",
        email,
      },
      { merge: true }
    );
  }

  try {
    await sendInviteEmail({ to: email, hostName, listingName, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send the invite email.";
    return { ok: false, status: 502, error: message };
  }

  return { ok: true, listingName };
}

export async function acceptCohostInvite(input: {
  uid: string;
  email: string;
  name: string;
  token: string;
}): Promise<Success | Failure> {
  const token = input.token.trim();
  if (!token) return { ok: false, status: 400, error: "Missing invite token." };

  const db = getAdminFirestore();
  const snap = await db.collection("cohostInvites").where("token", "==", token).limit(1).get();
  if (snap.empty) {
    return { ok: false, status: 404, error: "This invite link is invalid." };
  }

  const inviteDoc = snap.docs[0];
  const invite = inviteDoc.data();
  const inviteEmail = String(invite.email ?? "").toLowerCase();
  const signedInEmail = input.email.trim().toLowerCase();

  if (invite.status === "revoked") {
    return { ok: false, status: 410, error: "This invite has been revoked." };
  }
  if (invite.status === "accepted") {
    if (invite.cohostUid === input.uid) {
      return { ok: true, listingName: String(invite.listingName ?? "") };
    }
    return { ok: false, status: 409, error: "This invite has already been used." };
  }
  if (!signedInEmail || signedInEmail !== inviteEmail) {
    return {
      ok: false,
      status: 403,
      error: `Sign in with ${inviteEmail} to accept this invite.`,
    };
  }
  if (invite.hostUid === input.uid) {
    return { ok: false, status: 400, error: "You can't accept your own invite." };
  }

  const hostUid = String(invite.hostUid);
  const listingId = String(invite.listingId);
  const listingSnap = await db.doc(`users/${hostUid}/listings/${listingId}`).get();
  if (!listingSnap.exists) {
    return { ok: false, status: 404, error: "This property is no longer available." };
  }

  const listingName = String(listingSnap.data()?.name ?? invite.listingName ?? "Property");
  const members = await db.collection(`users/${hostUid}/listings/${listingId}/cohosts`).get();
  const previous = members.docs.find(
    (d) => d.data().inviteId === inviteDoc.id || String(d.data().email ?? "").toLowerCase() === inviteEmail
  );

  const batch = db.batch();
  const memberRef = db.doc(`users/${hostUid}/listings/${listingId}/cohosts/${input.uid}`);
  batch.set(memberRef, {
    email: inviteEmail,
    name: input.name || String(previous?.data()?.name ?? signedInEmail),
    status: "active",
    inviteId: inviteDoc.id,
    cohostUid: input.uid,
    invitedAt: previous?.data()?.invitedAt ?? FieldValue.serverTimestamp(),
    acceptedAt: FieldValue.serverTimestamp(),
  });
  if (previous && previous.id !== input.uid) {
    batch.delete(previous.ref);
  }
  batch.set(db.doc(`users/${input.uid}/sharedListings/${shareId(hostUid, listingId)}`), {
    hostUid,
    listingId,
    listingName,
    hostName: String(invite.hostName ?? ""),
    status: "active",
    email: inviteEmail,
  });
  batch.update(inviteDoc.ref, {
    status: "accepted",
    cohostUid: input.uid,
    acceptedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { ok: true, listingName };
}

export async function revokeCohost(input: {
  hostUid: string;
  listingId: string;
  memberId: string;
}): Promise<Success | Failure> {
  if (!input.listingId || !input.memberId) {
    return { ok: false, status: 400, error: "Missing cohost." };
  }

  const db = getAdminFirestore();
  const listingSnap = await db.doc(`users/${input.hostUid}/listings/${input.listingId}`).get();
  if (!listingSnap.exists) {
    return { ok: false, status: 404, error: "Property not found." };
  }

  const memberRef = db.doc(
    `users/${input.hostUid}/listings/${input.listingId}/cohosts/${input.memberId}`
  );
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    return { ok: false, status: 404, error: "Cohost not found." };
  }

  const data = memberSnap.data() ?? {};
  const cohostUid =
    typeof data.cohostUid === "string" && data.cohostUid
      ? data.cohostUid
      : input.memberId.startsWith("invite_")
        ? null
        : input.memberId;

  const batch = db.batch();
  batch.delete(memberRef);
  if (cohostUid) {
    batch.delete(db.doc(`users/${cohostUid}/sharedListings/${shareId(input.hostUid, input.listingId)}`));
  }
  if (typeof data.inviteId === "string" && data.inviteId) {
    batch.set(
      db.doc(`cohostInvites/${data.inviteId}`),
      { status: "revoked", revokedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
  return { ok: true };
}
