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
  if (!userId)
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
      status: 401,
    });
    
  const email = getSessionEmail();
  const plan = await getUserPlan();

  const body = await req.json().catch(() => null);
  const userText: string | undefined = body?.message?.trim();
  const clientMessages = body?.messages || [];
  const chatId: string | undefined = body?.chatId;

  if (!userText)
    return new Response(JSON.stringify({ error: "NO_MESSAGE" }), {
      status: 400,
    });

  let softLimit = false;

  /* ========= LIMIT ========= */

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

  /* ========= STATE & MODE ========= */

const userState = detectUserState(userText);
const crisisLevel = detectCrisis(userText);
const analysis = analyzeConversation(userText, history);

const mode = analysis.mode;
const simplified = analysis.simplified;

const relationalCore = buildRelationalCore({
  state: String(userState),
  messageIndex: history.length,
  mode,
  crisisLevel,
  simplified,
});

const systemPrompt = `
${relationalCore}

You CAN edit images when user uploads them.
Do NOT say you cannot edit images.
Instead ask what to change.
`;

  /* ========= OPENAI ========= */

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
       
      const response = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  temperature: 0.7,
  messages: [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userText },
  ],
});

const fullText =
  response.choices?.[0]?.message?.content || "Brak odpowiedzi";

const finalText = shapeResponse({
  text: fullText,
  softLimit,
  mode,
});

/* SAVE */

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
    role: "user",
    content: userText,
    createdAt: Date.now(),
  });

  await appendChatMessageByEmail(email, chatId, {
    id: crypto.randomUUID(),
    role: "assistant",
    content: finalText,
    createdAt: Date.now(),
  });
}

/* RESPONSE */

return new Response(
  JSON.stringify({ reply: finalText }),
  {
    headers: { "Content-Type": "application/json" },
  }
);
}