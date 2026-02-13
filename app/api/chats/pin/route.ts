import { NextResponse } from "next/server";
import { getSessionEmail } from "../../../lib/auth/session";
import { getUserPlan } from "../../../lib/userPlan";
import {
  getPinnedChatIdByEmail,
  setPinnedChatIdByEmail,
  clearPinnedChatIdByEmail,
} from "../../../lib/pinChat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const email = getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const plan = await getUserPlan();
  if (plan === "free") {
    return NextResponse.json(
      { error: "PRO_REQUIRED", message: "Historia rozmów jest w PRO." },
      { status: 403 }
    );
  }

  const pinnedChatId = await getPinnedChatIdByEmail(email);
  return NextResponse.json({ pinnedChatId });
}

export async function POST(req: Request) {
  const email = getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const plan = await getUserPlan();

  // ✅ pin tylko dla PRO+
  if (plan !== "pro_plus") {
    return NextResponse.json(
      {
        error: "PROPLUS_REQUIRED",
        message: "Przypinanie rozmów jest dostępne tylko w PRO+.",
      },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const chatId = (body?.chatId as string | undefined)?.trim();

  if (!chatId) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  await setPinnedChatIdByEmail(email, chatId);
  return NextResponse.json({ ok: true, pinnedChatId: chatId });
}

export async function DELETE() {
  const email = getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const plan = await getUserPlan();

  if (plan !== "pro_plus") {
    return NextResponse.json(
      {
        error: "PROPLUS_REQUIRED",
        message: "Przypinanie rozmów jest dostępne tylko w PRO+.",
      },
      { status: 403 }
    );
  }

  await clearPinnedChatIdByEmail(email);
  return NextResponse.json({ ok: true, pinnedChatId: null });
}