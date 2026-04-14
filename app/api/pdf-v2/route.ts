import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { Buffer } from "buffer";
import { getUserPlan } from "../../lib/userPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Mode = "summary" | "translate" | "analyze" | "keypoints";

export async function POST(req: Request) {
  try {
    const plan = await getUserPlan();

    if (plan === "free") {
      return NextResponse.json(
        { error: "PRO_REQUIRED", message: "PDF dostępny w PRO." },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const mode = formData.get("mode") as Mode | null;

    if (!file || !mode) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "ONLY_PDF_ALLOWED" }, { status: 400 });
    }

    // 📦 PDF → text
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);
    const text = parsed.text;

    if (!text) {
      return NextResponse.json({ error: "EMPTY_PDF" }, { status: 400 });
    }

    // ✂️ chunking (ważne!)
    const MAX = 20000;
    const chunks = [];
    for (let i = 0; i < text.length; i += MAX) {
      chunks.push(text.slice(i, i + MAX));
    }

    const promptMap: Record<Mode, string> = {
      summary: "Zrób krótkie streszczenie.",
      keypoints: "Wypisz najważniejsze punkty.",
      analyze: "Przeanalizuj dokument: cel, ryzyka, liczby, rekomendacje.",
      translate: "Przetłumacz tekst.",
    };

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 🧠 analiza chunków
    const partialResults = [];

    for (const chunk of chunks) {
      const res = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "Jesteś NaviMind. Odpowiadasz jasno i krótko.",
          },
          {
            role: "user",
            content: `${promptMap[mode]}\n\n${chunk}`,
          },
        ],
      });

      partialResults.push(res.output_text);
    }

    // 🔗 final summary (łączenie)
    const final = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: `Połącz to w jedną odpowiedź:\n\n${partialResults.join(
            "\n\n"
          )}`,
        },
      ],
    });

    return NextResponse.json({
      result: final.output_text,
      chunks: chunks.length,
      plan,
    });
  } catch (err) {
    console.error("PDF V2 ERROR:", err);
    return NextResponse.json({ error: "PDF_FAILED" }, { status: 500 });
  }
}