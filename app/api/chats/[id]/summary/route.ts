import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionEmail } from "../../../../lib/auth/session";
import { getUserPlan } from "../../../../lib/userPlan";
import {
  appendChatMessageByEmail,
  getChatMessagesByEmail,
} from "../../../../lib/chatHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildSummaryPrompt(lang: "pl" | "en") {
  if (lang === "pl") {
    return `
Zrób krótkie podsumowanie rozmowy (max 10 linijek).
Na końcu sekcja "Następne kroki" (max 3 punkty).
`;
  }

  return `
Create a short summary (max 10 lines).
End with "Next steps" (max 3 bullets).
`;
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
  if (plan !== "pro_plus") {
    return NextResponse.json({ error: "PROPLUS_REQUIRED" }, { status: 403 });
  }

  const chatId = params.id;
  const body = await req.json().catch(() => null);
  const lang = (body?.lang as "pl" | "en") || "pl";

  const last = (await getChatMessagesByEmail(email, chatId)).slice(-40);

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: buildSummaryPrompt(lang) },
      ...last.map((m) => ({ role: m.role as any, content: m.content })),
    ],
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) return NextResponse.json({ error: "EMPTY_SUMMARY" }, { status: 500 });

  await appendChatMessageByEmail(email, chatId, {
    id: crypto.randomUUID(),
    role: "assistant",
    content: text,
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true, summary: text });
}
