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

/* =========================
   STYL – TRYB ROZMOWY
   ========================= */
const STYLE_ANCHOR = `
Jesteś NaviMind.
Jesteś partnerem do rozmowy, nie terapeutą.
Pomagasz nazwać sedno sytuacji.
Nie moralizujesz. Nie przesłuchujesz.
`;

/* =========================
   STYL – TRYB PRAKTYCZNY
   ========================= */
const PRACTICAL_ANCHOR = `
Jesteś NaviMind.
Użytkownik zadał pytanie techniczne lub praktyczne.
Odpowiadasz konkretnie i rzeczowo.
Nie analizujesz emocji.
Nie zadajesz pytań zwrotnych.
`;

/* =========================
   FALLBACK (TYLKO ROZMOWA)
   ========================= */
const FALLBACK_SENTENCE =
  "Chcę dobrze zrozumieć — powiedz proszę, co jest teraz dla Ciebie najważniejsze.";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, hiddenContext } = body;

    if (!Array.isArray(messages)) {
      throw new Error("messages is not an array");
    }

    /* =========================
       USER + LIMIT
       ========================= */
    const userId = getUserId();
    const limit = await checkAndIncrementLimit(userId);

    if (!limit.allowed) {
      return Response.json(
        {
          error: "LIMIT_REACHED",
          text: "Limit demo został osiągnięty 🔒",
          limit,
        },
        { status: 429 }
      );
    }

    /* =========================
       HISTORIA (BASIC)
       ========================= */
    const history = messages
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-MAX_HISTORY);

    const lastUserMessage =
      history.filter((m: any) => m.role === "user").slice(-1)[0]?.content || "";

    /* =========================
       🔥 DETEKCJA PYTANIA PRAKTYCZNEGO
       ========================= */
    const isPractical = /^(jak|co|ile|gdzie|kiedy|czy|zrob|sprawdz)\b/i.test(
      lastUserMessage.trim()
    );

    /* =====================================================
       🔥🔥 TRYB PRAKTYCZNY — EARLY RETURN (KONIEC)
       ===================================================== */
    if (isPractical) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: PRACTICAL_ANCHOR },
          { role: "user", content: lastUserMessage },
        ],
      });

      const text =
        completion.choices[0]?.message?.content?.trim() ||
        "Sprawdź status deploya w panelu Vercel.";

      return Response.json({
        text,
        limit,
        uiHints: {
          isPractical: true,
        },
      });
    }

    /* =========================
       TRYB ROZMOWY (NORMALNY)
       ========================= */
    const analysis = await analyzeUserState(history);
    const conversationMode = detectConversationMode(
      lastUserMessage,
      analysis
    );
    const modePrompt = modeInstructions[conversationMode];

    const rawMemory = await getPseudoMemory(userId);
    const memory = rawMemory ?? { visits: 0 };

    const enrichedSystemPrompt = buildSystemPrompt(
      systemPrompt + "\n\nTRYB ROZMOWY:\n" + modePrompt,
      analysis,
      memory
    );

    await updatePseudoMemory(userId, analysis);

    const documentContext = hiddenContext
      ? {
          role: "system",
          content:
            "Użytkownik udostępnił dokument PDF.\n" +
            "Traktuj go jako kontekst.\n" +
            "Odpowiadaj tylko na to, o co pyta.\n\n" +
            hiddenContext.slice(0, 12000),
        }
      : null;

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

    if (!text || text.length < 10) {
      text = FALLBACK_SENTENCE;
    }

    return Response.json({
      text,
      limit,
      uiHints: {
        conversationMode,
        isPractical: false,
      },
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);
    return Response.json(
      { text: "Coś się wysypało po stronie serwera." },
      { status: 500 }
    );
  }
}