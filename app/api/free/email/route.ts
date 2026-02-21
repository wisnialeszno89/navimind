import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/userId";
import { saveRetentionEmail } from "../../../lib/retentionStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const userId = getUserId();

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const email = body?.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    await saveRetentionEmail(userId, email);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("SAVE FREE EMAIL ERROR:", e);
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
