import crypto from "crypto";

import { getUserId } from "../../lib/userId";
import { getSessionEmail } from "../../lib/auth/session";
import { getUserPlan } from "../../lib/userPlan";
import { getDemoMemory, pushDemoMemory } from "../../lib/demoMemory";
import { detectUserState } from "../../lib/detectUserState";
import { emotionalLayer } from "../../lib/emotionalLayer";

import {
  appendChatMessageByEmail,
  getChatMessagesByEmail,
} from "../../lib/chatHistory";

import { buildSystemPrompt } from "../../lib/buildSystemPrompt";
import { proPrompt } from "../../lib/proPrompt";
import { proPlusPrompt } from "../../lib/proPlusPrompt";
import { getProMemory, saveProMemory } from "../../lib/proMemory";

import { detectFirstState } from "../../lib/detectFirstState";
import { getFirstPrompt } from "../../lib/firstResponsePrompts";

import { detectCrisis } from "../../lib/crisisDetector";
import { getCrisisAddon } from "../../lib/crisisPrompt";
import { shapeResponse } from "../../lib/responseShaper";

import { getLastDays, analyzeEmotionTrend } from "../../lib/emotionTrend";
import { setLastActive } from "../../lib/lastActive";
import { getRetentionMessage } from "../../lib/retentionMessage";

import {
  checkAndIncrementLimit,
  FREE_HARD_LIMIT,
} from "../../lib/chatLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= CONFIG ================= */

const PRO_HISTORY_MAX = 20;
const MSG_CHAR_LIMIT = 1800;

type ChatRole = "user" | "assistant";

type ChatMsg = {
  role: ChatRole;
  content: string;
};

/* ================= HELPERS ================= */

function getUidFromUrl(req: Request) {
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    return uid && uid.trim().length > 0 ? uid.trim() : null;
  } catch {
    return null;
  }
}

function sse(data: any) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function isRole(r: any): r is ChatRole {
  return r === "user" || r === "assistant";
}

/* ================= ROUTE ================= */

export async function POST(req: Request) {
  const uidFromUrl = getUidFromUrl(req);
  const cookieUserId = getUserId();
  const userId = uidFromUrl ?? cookieUserId;

  if (!userId) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // zapis aktywności do retencji
  await setLastActive(userId);

  const email = getSessionEmail();
  const plan = await getUserPlan();

  const body = await req.json().catch(() => null);
  const userText: string | undefined = body?.message?.trim();
  const chatId: string | undefined = body?.chatId ?? undefined;
  const lang: "pl" | "en" = body?.lang === "en" ? "en" : "pl";

  if (!userText) {
    return new Response(JSON.stringify({ error: "NO_MESSAGE" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  /* ========= FREE LIMIT ========= */

  if (plan === "free") {
    const limit = await checkAndIncrementLimit(userId, FREE_HARD_LIMIT);

    if (!limit.allowed) {
      return new Response(JSON.stringify(limit), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /* ========= HISTORY ========= */

  let history: ChatMsg[] = [];

  if (plan === "free") {
    history = await getDemoMemory(userId);
  } else if (email && chatId) {
    try {
      const kvMsgs = await getChatMessagesByEmail(email, chatId);

      history =
        kvMsgs
          ?.map((m) => ({
            role: m.role,
            content: String(m.content ?? "").slice(0, MSG_CHAR_LIMIT),
          }))
          .filter((m): m is ChatMsg => isRole(m.role))
          .slice(-PRO_HISTORY_MAX) ?? [];
    } catch {
      history = [];
    }
  }

  /* ========= EMOTIONS ========= */

  const userState = detectUserState(userText);
  const crisisLevel = detectCrisis(userText);
  const crisisAddon = getCrisisAddon(crisisLevel, "pl");

  /* ========= FIRST MESSAGE ========= */

  const isFirstMessage = history.length === 0;
  let firstPromptAddon = "";

  if (isFirstMessage) {
    const firstState = detectFirstState(userText);
    firstPromptAddon = getFirstPrompt(firstState, lang);
  }

  /* ========= PRO+ MEMORY ========= */

  let proMemory = null;

  if (plan === "pro_plus") {
    proMemory = await getProMemory(userId);
  }

  const memoryBlock =
    plan === "pro_plus" && proMemory
      ? `
KONTEKST RELACJI:
- wizyty: ${proMemory.visits ?? 1}
- ostatni kontakt: ${proMemory.lastSeenAt ? "był wcześniej" : "pierwszy raz"}
- stan: ${proMemory.state ?? "nieznany"}
- główny problem: ${proMemory.mainProblem ?? "nieokreślony"}

Rozmawiaj naturalnie. Nie mów o pamięci wprost.
`
      : "";

  /* ========= EMOTION TREND (PRO+) ========= */

  let trendText = "";

  if (plan === "pro_plus") {
    try {
      const days = await getLastDays(userId, 7);
      const trend = analyzeEmotionTrend(days);

      if (trend) {
        trendText = `
KONTEKST OSTATNICH DNI:
${trend}

Wspomnij o tym naturalnie jednym zdaniem,
tylko jeśli pasuje do rozmowy.
`;
      }
    } catch {}
  }

  /* ========= RETENTION (PRO+) ========= */

  let retentionText = "";

  if (plan === "pro_plus") {
    try {
      const msg = await getRetentionMessage(userId);

      if (msg) {
        retentionText = `
KONTEKST POWROTU:
${msg}

Jeśli to pasuje — zacznij od jednego ciepłego zdania.
`;
      }
    } catch {}
  }

  /* ========= SYSTEM PROMPT ========= */

  const basePrompt = buildSystemPrompt();

  const planLayer =
    plan === "pro_plus"
      ? proPlusPrompt()
      : plan === "pro"
      ? proPrompt()
      : "";

  const systemPrompt = `
${basePrompt}

${planLayer}

${emotionalLayer(userState)}

${firstPromptAddon}

${memoryBlock}

${trendText}

${retentionText}

${crisisAddon}
`;

  /* 🔥 RUNTIME-ONLY OPENAI (KLUCZOWY FIX) */
  const { default: OpenAI } = await import("openai");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /* ========= STREAM ========= */

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(
        encoder.encode(sse({ type: "start", plan, chatId, crisisLevel }))
      );

      let fullText = "";

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          temperature: 0.4,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userText },
          ],
        });

        for await (const part of response) {
          const delta = part.choices?.[0]?.delta?.content ?? "";
          if (!delta) continue;

          fullText += delta;
          controller.enqueue(encoder.encode(sse({ type: "delta", delta })));
        }

        /* ========= SAVE ========= */

        if (fullText.trim()) {
          const finalText = shapeResponse({ text: fullText.trim() });

          if (plan === "free") {
            await pushDemoMemory(userId, { role: "user", content: userText });
            await pushDemoMemory(userId, {
              role: "assistant",
              content: finalText,
            });
          }

          if (plan !== "free" && email && chatId) {
            await appendChatMessageByEmail(email, chatId, {
              id: crypto.randomUUID(),
              role: "assistant",
              content: finalText,
              createdAt: Date.now(),
            });
          }

          if (plan === "pro_plus") {
            const prev = await getProMemory(userId);

            await saveProMemory(userId, {
              state: userText.slice(0, 60),
              mainProblem: userText.slice(0, 120),
              direction: "w trakcie",
              lastSeenAt: Date.now(),
              visits: (prev?.visits ?? 0) + 1,
              updatedAt: Date.now(),
            });
          }
        }

        controller.enqueue(encoder.encode(sse({ type: "done" })));
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(sse({ type: "error", message: "CHAT_FAILED" }))
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
