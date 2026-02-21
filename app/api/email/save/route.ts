import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/userId";
import { saveUserEmail } from "../../../lib/userEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const userId = getUserId();

  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body: Body = await req.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  await saveUserEmail(userId, email);

  return NextResponse.json({ ok: true });
}
