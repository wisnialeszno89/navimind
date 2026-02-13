import { NextResponse } from "next/server";
import { getSessionEmail } from "../../../lib/auth/session";
import { getUserPlan } from "../../../lib/userPlan";
import {
  appendChatMessageByEmail,
  deleteChatByEmail,
  getChatMessagesByEmail,
  listChatsByEmail,
} from "../../../lib/chatHistory";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function chatsIndexKey(email: string) {
  return `chats:${normalizeEmail(email)}`;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

  const messages = await getChatMessagesByEmail(email, params.id);
  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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
  if (!body) {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const role = body?.role as "user" | "assistant";
  const content = body?.content;

  if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  await appendChatMessageByEmail(email, params.id, {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}

// ✅ Rename chat (PRO+)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const email = getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const plan = await getUserPlan();
  if (plan !== "pro_plus") {
    return NextResponse.json(
      { error: "PROPLUS_REQUIRED", message: "Zmiana nazwy rozmowy jest w PRO+." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const title = (body?.title as string | undefined)?.trim();

  if (!title || title.length < 2) {
    return NextResponse.json(
      { error: "INVALID_TITLE", message: "Podaj nazwę (min. 2 znaki)." },
      { status: 400 }
    );
  }

  const safeTitle = title.slice(0, 60);

  const indexKey = chatsIndexKey(email);
  const chats = (await kv.get<any[]>(indexKey)) ?? [];

  const now = Date.now();

  const updated = chats.map((c) => {
    if (c.id !== params.id) return c;
    return { ...c, title: safeTitle, updatedAt: now };
  });

  await kv.set(indexKey, updated);

  return NextResponse.json({ ok: true, id: params.id, title: safeTitle });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

  await deleteChatByEmail(email, params.id);

  const chats = await listChatsByEmail(email);
  return NextResponse.json({ ok: true, chats });
}