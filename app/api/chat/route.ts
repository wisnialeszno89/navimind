import { systemPrompt } from "../../../lib/systemPrompt";
import { checkAndIncrementLimit } from "../../../lib/chatLimit";
import { getUserId } from "../../../lib/userId";
import { analyzeUserState } from "../../../lib/analyzeUserState";
import { buildSystemPrompt } from "../../../lib/buildSystemPrompt";
import { updatePseudoMemory } from "../../../lib/updatePseudoMemory";
import { getPseudoMemory } from "../../../lib/getPseudoMemory";

import { detectConversationMode } from "../../../lib/conversation/detectConversationMode";
import { modeInstructions } from "../../../lib/conversation/conversationModes";

import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MAX_HISTORY = 20;

/**
 * 🧭 STYL KOTWICZNY – ZEN
 * Partner do rozmowy, nie terapeuta, nie coach.
 */
const STYLE_ANCHOR = `
Jesteś NaviMind.
Jesteś partnerem do rozmowy, nie terapeutą.
Twoim celem jest pomóc jasno nazwać problem lub sedno sytuacji.
Jeśli widzisz sprzeczność, napięcie lub niejasność — nazwij ją wprost.
Nie moralizuj. Nie pocieszaj na siłę.
Myśl razem z użytkownikiem.
Jeśli nie wiesz, co powiedzieć — przyznaj to spokojnie.
`;

// 🆘 Jedyny fallback — pas bezpieczeństwa, nic więcej
const FALLBACK_SENTENCE =
  "Chcę dobrze zrozumieć — powiedz proszę, co jest teraz dla Ciebie najważniejsze.";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, hiddenContext } = body;

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
            "Masz 20 wiadomości na 24h.",
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
    // 2️⃣ HISTORIA (oczyszczona)
    // =========================
    let history = messages
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-MAX_HISTORY);

    // nie zaczynamy rozmowy od asystenta
    if (history[0]?.role === "assistant") {
      history.shift();
    }

    // =========================
    // 3️⃣ ANALIZA STANU
    // =========================
    const analysis = await analyzeUserState(history);

    const lastUserMessage =
      history.filter((m: any) => m.role === "user").slice(-1)[0]?.content || "";

    const conversationMode = detectConversationMode(
      lastUserMessage,
      analysis
    );

    const modePrompt = modeInstructions[conversationMode];

    // =========================
    // 4️⃣ PSEUDO-PAMIĘĆ
    // =========================
    const rawMemory = await getPseudoMemory(userId);
    const memory = rawMemory ?? { visits: 0 };

    const enrichedSystemPrompt = buildSystemPrompt(
      systemPrompt +
        "\n\nTRYB ROZMOWY:\n" +
        modePrompt,
      analysis,
      memory
    );

    await updatePseudoMemory(userId, analysis);

    // =========================
    // 5️⃣ PDF JAKO KONTEKST
    // =========================
    const documentContext = hiddenContext
      ? {
          role: "system",
          content:
            "Użytkownik udostępnił dokument PDF.\n" +
            "Traktuj go jako kontekst pomocniczy.\n" +
            "Nie streszczaj go.\n" +
            "Odpowiadaj wyłącznie na to, o co użytkownik pyta.\n\n" +
            hiddenContext.slice(0, 12000),
        }
      : null;

    // =========================
    // 6️⃣ AI RESPONSE
    // =========================
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: STYLE_ANCHOR },
        { role: "system", content: enrichedSystemPrompt },
        ...(documentContext ? [documentContext] : []),
        ...history,
      ] as any,
    });

    let text =
      completion.choices[0]?.message?.content?.trim() || "";

    // 🆘 fallback tylko gdy model faktycznie nie ma treści
    if (!text || text.length < 10) {
      text = FALLBACK_SENTENCE;
    }

    // =========================
    // 7️⃣ RESPONSE DO UI
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
        conversationMode,
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