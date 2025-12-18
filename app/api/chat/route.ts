import { systemPrompt } from "../../../lib/systemPrompt";
import { checkAndIncrementLimit } from "../../../lib/chatLimit";
import { getUserId } from "../../../lib/userId";
import { analyzeUserState } from "../../../lib/analyzeUserState";
import { buildSystemPrompt } from "../../../lib/buildSystemPrompt";
import { updatePseudoMemory } from "../../../lib/updatePseudoMemory";
import { getPseudoMemory } from "../../../lib/getPseudoMemory";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_HISTORY = 20;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages)) {
      throw new Error("messages is not an array");
    }

    // =========================
    // 1️⃣ IDENTYFIKACJA USERA + LIMIT
    // =========================
    const userId = getUserId();
    const limit = await checkAndIncrementLimit(userId);

    if (!limit.allowed) {
      return Response.json(
        {
          error: "LIMIT_REACHED",
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
    // 2️⃣ FILTR + HISTORIA
    // =========================
    let history = messages
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-MAX_HISTORY);

    // 🔒 NIE pozwalamy zaczynać od assistant
    if (history[0]?.role === "assistant") {
      history.shift();
    }

    // =========================
    // 3️⃣ ANALIZA STANU (KROK 2.B)
    // =========================
    const analysis = await analyzeUserState(history);

    // =========================
    // 4️⃣ PSEUDO-PAMIĘĆ (KROK 2.C)
    // =========================
    const rawMemory = await getPseudoMemory(userId);

    const memory = rawMemory ?? {
      visits: 0,
    };

    const enrichedSystemPrompt = buildSystemPrompt(
      systemPrompt,
      analysis,
      memory
    );

    await updatePseudoMemory(userId, analysis);

    // =========================
    // 5️⃣ ODPOWIEDŹ AI
    // =========================
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: ([
        { role: "system", content: enrichedSystemPrompt },
        ...history.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ] as any),
      temperature: 0.7,
    });

    const text =
      completion.choices[0]?.message?.content?.trim() ||
      "Chwila ciszy. Spróbuj jeszcze raz.";

    // =========================
    // 6️⃣ RESPONSE DO UI (TEKST + LIMIT + UI HINTS)
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