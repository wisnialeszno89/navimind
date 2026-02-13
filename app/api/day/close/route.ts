import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/userId";
import { saveDayMemory } from "../../../lib/dayMemory";
import { shapeResponse } from "../../../lib/responseShaper";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { highlight, emotion } = body ?? {};
  const date = new Date().toISOString().slice(0, 10);

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "2 spokojne zdania podsumowania dnia + 1 mały krok na jutro. Bez pytań.",
      },
      { role: "user", content: `Dzień: ${highlight}\nEmocja: ${emotion}` },
    ],
  });

  const raw = completion.choices[0].message.content ?? "";
  const final = shapeResponse({ text: raw });

  const parts = final.split(/\n|\./).filter(Boolean);

  await saveDayMemory(userId, {
    date,
    highlight,
    emotion,
    summary: parts[0] ?? final,
    microStep: parts[1] ?? "Jeden mały spokojny krok jutro.",
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
