import crypto from "crypto";
import { getUserId } from "../../lib/userId";
import { getSessionEmail } from "../../lib/auth/session";
import { getUserPlan } from "../../lib/userPlan";
import { getDemoMemory, pushDemoMemory } from "../../lib/demoMemory";
import { detectUserState } from "../../lib/detectUserState";
import {
  appendChatMessageByEmail,
  getChatMessagesByEmail,
} from "../../lib/chatHistory";
import { buildRelationalCore } from "../../lib/relationalCore";
import { analyzeConversation } from "../../lib/conversationAnalyzer";
import { detectCrisis } from "../../lib/crisisDetector";
import {
  checkAndIncrementLimit,
  FREE_HARD_LIMIT,
  FREE_SOFT_FROM,
} from "../../lib/chatLimit";
import { shapeResponse } from "../../lib/responseShaper";
import { detectResponseDepth } from "../../lib/responseDepth";
import { getPseudoMemory } from "../../lib/getPseudoMemory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRO_HISTORY_MAX = 12;
const MSG_CHAR_LIMIT = 1800;

type ChatRole = "user" | "assistant";
type ChatMsg = { role: ChatRole; content: string };

function getUidFromUrl(req: Request) {
  try {
    const url = new URL(req.url);
    return url.searchParams.get("uid") || null;
  } catch {
    return null;
  }
}

function isRole(r: any): r is ChatRole {
  return r === "user" || r === "assistant";
}

export async function POST(req: Request) {
  const userId = getUidFromUrl(req) ?? getUserId();

  if (!userId) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
      status: 401,
    });
  }

  const email = getSessionEmail();
  const plan = await getUserPlan();

  const body = await req.json().catch(() => null);
  const userText: string | undefined = body?.message?.trim();

  if (!userText) {
    return new Response(JSON.stringify({ error: "NO_MESSAGE" }), {
      status: 400,
    });
  }

  const chatId: string | undefined = body?.chatId;

  /* ========= STYLE ========= */

  const textLen = userText.length;

  const isShort = textLen < 80;
  const isLong = textLen > 300;

  const isChaotic =
    /(nie wiem|wszystko naraz|chaos|pogubiony|zagubiony)/i.test(userText);

  const isDirect =
    /(co zrobić|konkretnie|powiedz wprost|bez gadania)/i.test(userText);

  /* ========= LIMIT ========= */

  let softLimit = false;

  if (plan === "free") {
    const limit = await checkAndIncrementLimit(userId, FREE_HARD_LIMIT);

    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          error: "FREE_LIMIT",
          message: "Na dziś kończy się darmowa przestrzeń rozmowy.",
          cta: "Przejdź do NaviMind PRO",
        }),
        { status: 402 }
      );
    }

    if (limit.used >= FREE_SOFT_FROM) {
      softLimit = true;
    }
  }

  /* ========= HISTORY ========= */

  let history: ChatMsg[] = [];

  if (plan === "free") {
    history = await getDemoMemory(userId);
  } else if (email && chatId) {
    const kvMsgs = await getChatMessagesByEmail(email, chatId);

    history =
      kvMsgs
        ?.map((m) => ({
          role: m.role,
          content: String(m.content).slice(0, MSG_CHAR_LIMIT),
        }))
        .filter((m): m is ChatMsg => isRole(m.role))
        .slice(-PRO_HISTORY_MAX) ?? [];
  }

  const isFirstMessage = history.length === 0;

  /* ========= ANALYSIS ========= */

  const userState = detectUserState(userText);
  const crisisLevel = detectCrisis(userText);
  const analysis = analyzeConversation(userText, history);

  const mode = analysis.mode;
  const simplified = analysis.simplified;
  const depth = detectResponseDepth(userText, history.length);

  const wantsAnswer =
    /(co zrobić|co robic|jak to ogarnąć|jak rozwiazac|co dalej)/i.test(
      userText.toLowerCase()
    );

  /* ========= MEMORY ========= */

  const memory = await getPseudoMemory(userId);

  const dominantTheme =
    memory?.coreThemes &&
    Object.entries(memory.coreThemes).sort((a, b) => b[1] - a[1])[0]?.[0];

  const dominantTension =
    memory?.tensions &&
    Object.entries(memory.tensions).sort((a, b) => b[1] - a[1])[0]?.[0];

  const dominantAvoidance =
    memory?.avoidances &&
    Object.entries(memory.avoidances).sort((a, b) => b[1] - a[1])[0]?.[0];

  const styleMemory = memory?.style;

  const memoryStyle = {
    prefersShort:
      (styleMemory?.short || 0) > (styleMemory?.long || 0),

    prefersDirect:
      (styleMemory?.direct || 0) > 3,

    oftenChaotic:
      (styleMemory?.chaotic || 0) > 3,
  };

  /* ========= BEHAVIOR ========= */

  const repeatingLifePattern =
    dominantTheme && history.length > 5 && Math.random() > 0.6;

  const likelyLoop =
    dominantAvoidance && Math.random() > 0.65;

  const confrontationTrigger =
    dominantTension && mode !== "crisis" && Math.random() > 0.7;

  /* ========= CORE ========= */

  const relationalCore = buildRelationalCore({
    state: String(userState),
    messageIndex: history.length,
    mode,
    crisisLevel,
    simplified,
    depth,
    wantsAnswer,
  });

  /* ========= PROMPT ========= */

  const systemPrompt = `
${relationalCore}

USER STYLE:
${isShort ? "- pisze krótko" : ""}
${isLong ? "- pisze długo" : ""}
${isChaotic ? "- chaos" : ""}
${isDirect ? "- chce konkretów" : ""}

MEMORY:
${dominantTheme ? `- powtarzający temat: ${dominantTheme}` : ""}
${dominantTension ? `- napięcie: ${dominantTension}` : ""}
${dominantAvoidance ? `- unikanie: ${dominantAvoidance}` : ""}

ZASADY:
- nie mów że pamiętasz
- używaj tego subtelnie
`;

  /* ========= OPENAI ========= */

  const { default: OpenAI } = await import("openai");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.8,
    max_tokens: 1000,
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userText },
    ],
  });

  let fullText = response.choices?.[0]?.message?.content || "";

  if (isFirstMessage && fullText) {
    const hooks = [
      "Zobaczmy to spokojnie.",
      "Tu jest coś, co warto dobrze złapać.",
      "Nie chodzi tylko o to, co napisałeś.",
      "Jest tu jeden moment, który zmienia wszystko.",
    ];

    const randomHook =
      hooks[Math.floor(Math.random() * hooks.length)];

    fullText = randomHook + "\n\n" + fullText;
  }

  if (!fullText.trim()) {
    fullText =
      "Z tego co opisujesz wynika, że warto spojrzeć na to jeszcze raz z innej strony.";
  }

  /* ========= SHAPE ========= */

  const finalText = shapeResponse({
    text: fullText,
    softLimit,
    mode,
  });

  let finalOutput = finalText;

  /* ========= SMART LAYER ========= */

  if (repeatingLifePattern && dominantTheme) {
    finalOutput += `\n\n— Ten temat wraca. Nie pierwszy raz.`;
  }

  if (likelyLoop && dominantAvoidance) {
    finalOutput += `\n\n— Możliwe, że znowu omijasz ten sam punkt.`;
  }

  if (confrontationTrigger && dominantTension) {
    finalOutput += `\n\n— Tu nie chodzi tylko o sytuację. Jest w tym coś głębszego.`;
  }

  /* ========= SAVE ========= */

  if (plan === "free") {
    await pushDemoMemory(userId, {
      role: "user",
      content: userText,
    });

    await pushDemoMemory(userId, {
      role: "assistant",
      content: finalOutput,
    });
  }

  if (plan !== "free" && email && chatId) {
    await appendChatMessageByEmail(email, chatId, {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      createdAt: Date.now(),
    });

    await appendChatMessageByEmail(email, chatId, {
      id: crypto.randomUUID(),
      role: "assistant",
      content: finalOutput,
      createdAt: Date.now(),
    });
  }

  /* ========= RESPONSE ========= */

  return new Response(
    JSON.stringify({ reply: finalOutput }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}