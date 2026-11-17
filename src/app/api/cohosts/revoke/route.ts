import { NextRequest, NextResponse } from "next/server";
import { revokeCohost } from "@/lib/cohostServer";
import { requireUser } from "@/lib/requireUser";

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "You need to be signed in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await revokeCohost({
      hostUid: user.uid,
      listingId: String(body?.listingId ?? ""),
      memberId: String(body?.memberId ?? ""),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cohosts/revoke]", err);
    return NextResponse.json({ error: "Couldn't remove the cohost." }, { status: 500 });
  }
}
