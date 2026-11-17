import { NextRequest, NextResponse } from "next/server";
import { inviteCohost } from "@/lib/cohostServer";
import { requireUser } from "@/lib/requireUser";

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "You need to be signed in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const listingId = String(body?.listingId ?? "");
    const email = String(body?.email ?? "");
    if (!listingId) {
      return NextResponse.json({ error: "Missing property." }, { status: 400 });
    }

    const result = await inviteCohost({
      hostUid: user.uid,
      hostEmail: user.email ?? "",
      listingId,
      email,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cohosts/invite]", err);
    return NextResponse.json({ error: "Couldn't send the invite." }, { status: 500 });
  }
}
