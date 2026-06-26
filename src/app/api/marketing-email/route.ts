import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source =
      typeof body.source === "string" ? body.source.trim().slice(0, 100) : "landing";

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    let db;
    try {
      db = getAdminFirestore();
    } catch (err) {
      console.error("[marketing-email] Firebase Admin init failed:", err);
      return NextResponse.json(
        { error: "Signup is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    await db.collection("marketingEmails").add({
      email,
      source,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[marketing-email] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong — please try again." },
      { status: 500 }
    );
  }
}
