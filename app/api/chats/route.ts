import { NextResponse } from "next/server";
import { getSessionEmail } from "../../lib/auth/session";
import { getUserPlan } from "../../lib/userPlan";
import {
  listChatsByEmail,
  createChatByEmail,
} from "../../lib/chatHistory";
import { getPinnedChatIdByEmail } from "../../lib/pinChat";

export const runtime = "nodejs";

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

  const chats = await listChatsByEmail(email);
  const pinnedChatId = await getPinnedChatIdByEmail(email);

  // ✅ pinned zawsze na górze
  const sorted = [...chats].sort((a: any, b: any) => {
    if (pinnedChatId) {
      if (a.id === pinnedChatId) return -1;
      if (b.id === pinnedChatId) return 1;
    }
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  });

  return NextResponse.json({ chats: sorted, pinnedChatId });
}

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => null);
  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim()
      : "New chat";

  const id = crypto.randomUUID();
  const now = Date.now();

  await createChatByEmail(email, {
    id,
    title,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, id });
}