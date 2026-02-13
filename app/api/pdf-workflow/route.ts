import { NextResponse } from "next/server";
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

    const body = await req.json().catch(() => null);
    const mode = body?.mode as Mode | undefined;
    const text = body?.text as string | undefined;

    if (!mode || !text) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }

    const trimmed = text.slice(0, 45_000);

    const promptMap: Record<Mode, string> = {
      summary: "Zrób krótkie streszczenie PDF + 1 zdanie wniosku.",
      keypoints: "Wypisz najważniejsze punkty z PDF.",
      analyze: "Przeanalizuj dokument: cel, ryzyka, liczby, rekomendacje.",
      translate: "Przetłumacz tekst zachowując sens.",
    };

    /* 🔥 RUNTIME OPENAI */
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Jesteś NaviMind. Odpowiadasz jasno i krótko." },
        { role: "user", content: `${promptMap[mode]}\n\n${trimmed}` },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim();

    if (!result) {
      return NextResponse.json({ error: "EMPTY_RESPONSE" }, { status: 500 });
    }

    return NextResponse.json({ result, mode, plan });
  } catch (err) {
    console.error("PDF WORKFLOW ERROR:", err);
    return NextResponse.json({ error: "PDF_FAILED" }, { status: 500 });
  }
}