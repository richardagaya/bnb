import { NextRequest, NextResponse } from "next/server";
import { acceptCohostInvite } from "@/lib/cohostServer";
import { requireUser } from "@/lib/requireUser";

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user?.email) {
    return NextResponse.json({ error: "You need to be signed in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const claims = user as { name?: string };
    const result = await acceptCohostInvite({
      uid: user.uid,
      email: user.email,
      name: claims.name ?? "",
      token: String(body?.token ?? ""),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, listingName: result.listingName ?? "" });
  } catch (err) {
    console.error("[cohosts/accept]", err);
    return NextResponse.json({ error: "Couldn't accept the invite." }, { status: 500 });
  }
}
