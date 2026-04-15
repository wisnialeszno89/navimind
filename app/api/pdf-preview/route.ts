import pdf from "pdf-parse";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const instruction = formData.get("instruction") as string;

    if (!file) {
      return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const ai = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Zwróć tylko poprawiony tekst bez komentarzy.",
        },
        {
          role: "user",
          content: `
Instrukcja:
${instruction || "Popraw i uprość tekst."}

TEKST:
${parsed.text}
          `,
        },
      ],
    });

    const newText = ai.choices[0]?.message?.content || "";

    return NextResponse.json({
    original: parsed.text.slice(0, 500),
    edited: newText.slice(0, 500),
    });

  } catch {
    return NextResponse.json({ error: "PREVIEW_FAILED" }, { status: 500 });
  }
}