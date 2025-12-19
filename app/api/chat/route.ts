import { systemPrompt } from "../../../lib/systemPrompt";
import { checkAndIncrementLimit } from "../../../lib/chatLimit";
import { getUserId } from "../../../lib/userId";
import { analyzeUserState } from "../../../lib/analyzeUserState";
import { buildSystemPrompt } from "../../../lib/buildSystemPrompt";
import { updatePseudoMemory } from "../../../lib/updatePseudoMemory";
import { getPseudoMemory } from "../../../lib/getPseudoMemory";

import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MAX_HISTORY = 20;

// 🔒 TWARDY KOTWICZNY STYL (NIE DO DYSKUSJI)
const STYLE_ANCHOR = `
Jesteś NaviMind.

Mów krótko i konkretnie.
Unikaj zwrotów typu:
- „Widzę, że…”
- „Rozumiem Cię…”
- „Wydaje się, że…”

Zamiast tego używaj:
- „Tu jest sedno.”
- „Sprawdźmy to.”
- „To ma sens — ale pod jednym warunkiem.”

Nie jesteś terapeutą ani coachem.
Jesteś trzeźwym rozmówcą.

Używaj emotek oszczędnie 🙂🔥
**Pogrubiaj tylko kluczowe informacje.**
Nigdy nie bądź rozwlekły.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages)) {
      throw new Error("messages is not an array");
    }

    // =========================
    // 1️⃣ USER + LIMIT
    // =========================
    const userId = getUserId();
    const limit = await checkAndIncrementLimit(userId);

    if (!limit.allowed) {
      return Response.json(
        {
          error: "LIMIT_REACHED",
          text:
            "Limit demo został osiągnięty 🔒\n\n" +
            "Masz 20 wiadomości na 24h. Wersja PRO nie ma limitów.",
          limit: {
            used: limit.used,
            limit: limit.limit,
            resetAt: limit.resetAt,
          },
        },
        { status: 429 }
      );
    }

    // =========================
    // 2️⃣ HISTORIA (FILTR)
    // =========================
    let history = messages
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-MAX_HISTORY);

    if (history[0]?.role === "assistant") {
      history.shift();
    }

    // =========================
    // 3️⃣ ANALIZA STANU
    // =========================
    const analysis = await analyzeUserState(history);

    // =========================
    // 4️⃣ PSEUDO-PAMIĘĆ
    // =========================
    const rawMemory = await getPseudoMemory(userId);
    const memory = rawMemory ?? { visits: 0 };

    const enrichedSystemPrompt = buildSystemPrompt(
      systemPrompt,
      analysis,
      memory
    );

    await updatePseudoMemory(userId, analysis);

    // =========================
    // 5️⃣ AI RESPONSE
    // =========================
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: STYLE_ANCHOR },
        {
          role: "system",
          content:
            enrichedSystemPrompt +
            "\n\nTo jest wersja DEMO (limit 20 wiadomości).",
        },
        ...history.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ] as any,
    });

    const text =
      completion.choices[0]?.message?.content?.trim() ||
      "Chwila ciszy. Spróbuj jeszcze raz.";

    // =========================
    // 6️⃣ RESPONSE DO UI
    // =========================
    return Response.json({
      text,
      limit: {
        used: limit.used,
        limit: limit.limit,
        resetAt: limit.resetAt,
      },
      uiHints: {
        returningUser: memory.visits >= 2,
        shouldPause: analysis.avoidance || analysis.clarity === "low",
        focusShift: true,
      },
    });
  } catch (error) {
    console.error("CHAT API ERROR FULL:", error);

    return Response.json(
      { text: "Coś się wysypało po stronie serwera." },
      { status: 500 }
    );
  }
}