import { getPersonalityStyle } from "../../lib/personalityEngine";
import { buildResourcePrompt } from "../../lib/smartResources";
import { getUserProfile, updateUserProfile } from "../../lib/userProfile";
import { extractActionStep } from "../../lib/nextStepEngine";
// import { shapeResponse } ...
// import { detectIntent } ...
// import { detectMode } ...
// import { generateOptions } from "../../lib/decisionEngine";
import { shapeResponse } from "@/lib/responseShaper";
import { detectIntent } from "@/lib/brainRouter";
import { buildConversationSummary } from "../../lib/conversationSummary";
import { extractContextAnchor } from "../../lib/contextAnchor";
import { updateContextAnchor, getContextAnchor } from "../../lib/userMemory";
import { updateUserIdentity, getUserIdentity } from "@/lib/userIdentity";
import {
  detectMode,
  isLooping,
  shouldAllowQuestion,
  isFirstHeavyMessage
} from "@/lib/brainRouter";
import { buildTone } from "../../lib/buildTone";
import { getNextStep } from "../../lib/nextStepEngine";
import { buildSystemPrompt } from "@/lib/buildSystemPrompt";
import { updateMemory, getMemory, updateCoreMemory, getCoreMemory } from "../../lib/userMemory";

import { extractChosenOption } from "../../lib/nextStepEngine";
import { saveDecision } from "../../lib/userProfile";
import crypto from "crypto";
import { getUserId } from "../../lib/userId";
import { getSessionEmail } from "../../lib/auth/session";
import { getUserPlan } from "../../lib/userPlan";
import { getDemoMemory, pushDemoMemory, updateDemoCore, getDemoCore } from "../../lib/demoMemory";
import { analyzeUserMessage } from "../../lib/analyzeUserMessage";
import { injectResources } from "../../lib/resources";
import { formatResponse } from "../../lib/outputEngine";
import {
  appendChatMessageByEmail,
  getChatMessagesByEmail,
  } from "../../lib/chatHistory";
  

import {
  cleanAndShapeOutput,
  removeRepeatEndings,
  fixCutOff,
  } from "../../lib/outputEngine";

import { improveResponse } from "../../lib/responseQuality";
import { scoreResponse } from "../../lib/responseScore";
import { addSmartQuestion } from "../../lib/resources"; // lub osobny plik jak chcesz


export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function addEmphasis(text: string) {
  return text
    .replace(/\b(problem|ważne|kluczowe|sedno)\b/gi, "**$1**")
    .replace(/To jest ([^.\n]+)/g, "**To jest $1**")
    .replace(/Masz dwie opcje:/g, "**Masz dwie opcje:**");
}

function addSpacing(text: string) {
  return text
    .replace(/\. /g, ".\n\n")
    .replace(/\n{3,}/g, "\n\n");
}

function addTone(text: string) {
  if (text.includes("problem")) return "⚠️ " + text;
  if (text.includes("opcje")) return "👉 " + text;
  if (text.includes("ważne")) return "🔥 " + text;

  return text;
}
function wasHeavyAlready(history: any[]) {
  return history.some((m) =>
    m.content.includes("To nie jest lekka sytuacja")
  );
}
const USE_LEGACY_ENGINE = false;

type ChatRole = "user" | "assistant";
type ChatMsg = { role: ChatRole; content: string };

function isRole(r: any): r is ChatRole {
  return r === "user" || r === "assistant";
}

/* ========= MODE ========= */

type Mode = "explain" | "action" | "reflect" | "crisis";

function decideMode(input: string): Mode {
  const t = input.toLowerCase();

  if (/głosy|nie mogę spać|nie daje rady|przytłacza|nie mam po co żyć/.test(t)) {
    return "crisis";
  }

  if (/co zrobić|jak|co robic/.test(t)) {
    return "action";
  }

  if (/dlaczego|czemu/.test(t)) {
    return "explain";
  }

  return "reflect";
}

/* ========= CORE PROBLEM ========= */

function extractCoreProblem(text: string, history: ChatMsg[]) {
  const full = [...history.map(m => m.content), text].join(" ").toLowerCase();

  const topics = [
    {
      key: "children",
      label: "brak kontaktu z dziećmi",
      regex: /dzieci|kontakt z dziecmi/,
    },
    {
      key: "relationship",
      label: "rozpad związku",
      regex: /zona|żona|rozstanie|odeszla|odeszła/,
    },
    {
      key: "mental",
      label: "przeciążenie / depresja",
      regex: /depresja|nie dam rady|rozsypany|wykonczony|wykończony|nie moge zyc/,
    },
  ];

  const scored = topics.map(t => {
    const matches = full.match(new RegExp(t.regex, "g"));
    return {
      ...t,
      score: matches ? matches.length : 0,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const main = scored[0];
  const secondary = scored[1];

  return {
    main: main.score > 0 ? main : null,
    secondary: secondary.score > 0 ? secondary : null,
    all: scored.filter(s => s.score > 0),
  };
}

/* ========= ROUTE ========= */

export async function POST(req: Request) {
  const userId = getUserId();

  if (!userId) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
      status: 401,
    });
  }

  const email = getSessionEmail();
  const plan = await getUserPlan();

  const body = await req.json().catch(() => null);
  const userText: string = String(body?.message || "").trim();
  const analysis = analyzeUserMessage(userText);
  const intent = "general";
    
  updateUserProfile(userId, analysis);

  const userProfile = getUserProfile(userId);
  if (!userText) {
  return new Response(JSON.stringify({ error: "NO_MESSAGE" }), {
    status: 400,
  });
}



/* ========= MEMORY ========= */

updateMemory(userId, userText);
updateUserIdentity(userId, userText);

const identity = getUserIdentity(userId);
const memory = getMemory(userId);

/* ========= HISTORY ========= */

let history: ChatMsg[] = [];

if (plan === "free") {
  history = await getDemoMemory(userId);
} else if (email && body?.chatId) {
  const kvMsgs = await getChatMessagesByEmail(email, body.chatId);
  history =
    kvMsgs
      ?.map((m) => ({
        role: m.role,
        content: String(m.content),
      }))
      .filter((m): m is ChatMsg => isRole(m.role))
      .slice(-20) ?? [];
}
/* ========= MODE ========= */

const mode = "normal";

/* ========= AUTO FLOW ENGINE ========= */

function detectFlowStage(analysis: any, history: any[]) {
  const lastMessages = history
    .slice(-3)
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();

  if (/wybieram|biorę|ok|dobra|idziemy|robimy/.test(lastMessages)) {
    return "action";
  }

  if (analysis.mode === "direction") {
    return "direction";
  }

  if (
    analysis.state === "emotional" ||
    analysis.state === "overthinking"
  ) {
    return "support";
  }

  return "support";
}

const autoFlow = detectFlowStage(analysis, history);
userProfile.flowStage = autoFlow;
/* ========= ANALIZA ========= */


const coreProblem = extractCoreProblem(userText, history);
let safeCoreProblem = coreProblem;

if (
  analysis.state === "emotional" &&
  !analysis.intent?.includes("decision")
) {
  safeCoreProblem = {
    main: null,
    secondary: null,
    all: [],
  };
}

/* ========= MEMORY CORE ========= */

if (plan === "free" && coreProblem.main?.label) {
  updateDemoCore(userId, coreProblem.main.label);
}

if (coreProblem.main?.label) {
  updateCoreMemory(userId, coreProblem.main.label);
}

const demoCore = getDemoCore(userId);
const coreMemory = getCoreMemory(userId);

/* ========= CONTEXT ========= */

const lastUserMessages = history
  .filter((m) => m.role === "user")
  .slice(-3)
  .map((m) => m.content);

const topicAnchor = lastUserMessages.join(" | ");

/* ========= BUILD ELEMENTS ========= */

const contextBlock = `
AKTUALNY WĄTEK:
${topicAnchor}

NOWA WIADOMOŚĆ:
"${userText}"
`;

const coreBlock = `
NAJWAŻNIEJSZY PROBLEM:
${coreProblem.main?.label || ""}

DODATKOWE:
${coreProblem.secondary?.label || ""}
`;

const memoryBlock = `
PAMIĘĆ:
${demoCore?.mainTopic ? `- temat: ${demoCore.mainTopic}` : ""}
${coreMemory?.mainTopic ? `- temat: ${coreMemory.mainTopic}` : ""}
${memory?.emotionalState ? `- stan: ${memory.emotionalState}` : ""}
`;
const tone = buildTone(userProfile);
const personality = getPersonalityStyle(analysis);

/* ========= OPENAI ========= */

const { default: OpenAI } = await import("openai");


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 summary
const summary = buildConversationSummary(history);

// 🔹 ostatnia odpowiedź (kontynuacja)
const lastAssistant = history
  .filter(m => m.role === "assistant")
  .slice(-1)[0]?.content;

const continuationHint = lastAssistant
  ? `NAWIĄŻ do tego co wcześniej powiedziałeś:
"${lastAssistant.slice(-200)}"`
  : "";

// 🔹 context anchor (NOWY + zapis)
const contextAnchor = extractContextAnchor([
  ...history,
  { role: "user", content: userText }
]);

updateContextAnchor(userId, contextAnchor);

// 🔹 fallback jeśli brak nowego
const savedAnchor = getContextAnchor(userId);

// 🔹 finalny anchor
const finalAnchor = contextAnchor || savedAnchor || "";
const lastUser = history
  .filter(m => m.role === "user")
  .slice(-1)[0]?.content || "";

// 🔹 SYSTEM PROMPT
const systemPrompt = buildSystemPrompt({
  analysis,
  userProfile,
  memory,
  coreProblem: safeCoreProblem,
  contextBlock,
  tone,
  personality,
  summary,
  finalAnchor,
  lastUser,
  continuationHint,
});
const response = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  temperature: 0.7,
  max_tokens: 800,
  stop: ["\n\n\n"],
  messages: [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userText },
  ],
});

let baseText = response.choices?.[0]?.message?.content || "";

let responseParts: string[] = [];

/* ========= STYLE ENGINE ========= */

const isEmotional =
  analysis.state === "emotional" ||
  analysis.state === "overthinking";

const isEarlyStage = history.length < 4;

const shouldUseList =
  userProfile.flowStage === "direction" &&
  !isEmotional &&
  history.length > 5 &&
  /wybrać|co zrobić|jaką opcję/.test(userText.toLowerCase());

const shouldStayConversational =
  isEmotional || userProfile.flowStage !== "direction";

const shouldPushAction =
  userProfile.flowStage === "action";

/* ========= DECISION DETECT ========= */

const lastAssistantMessage =
  history.filter((m) => m.role === "assistant").slice(-1)[0]?.content || "";

const chosen = extractChosenOption(userText, lastAssistantMessage);

if (chosen) {
  saveDecision(userId, chosen);
} else if (
  /wybieram|biorę|ok|dobra|idziemy/.test(userText.toLowerCase())
) {
  saveDecision(userId, userText);
}

/* ========= CLEAN ========= */

baseText = cleanAndShapeOutput(baseText);

/* ========= QUESTION ========= */

const question = addSmartQuestion("", userText);
let finalOutput = baseText.trim();

finalOutput = finalOutput

  // 🔥 rozbij nagłówki na osobne linie
  .replace(/(🔥|⚠️|👉|✔️)\s*/g, "\n\n$1 ")

  // 🔥 każda sekcja po ":" zaczyna nową linię
  .replace(/:\s*/g, ":\n")

  // 🔥 bullet listy (usuwa inline chaos)
  .replace(/\s*[-•]\s*/g, "\n• ")

  // 🔥 jeśli punkty są w jednej linii → rozbij
  .replace(/• ([^•]+)/g, (m) => "\n• " + m.slice(2).trim())

  // 🔥 usuń indenty (twoje 4 spacje)
  .replace(/\n\s{2,}/g, "\n")

  // 🔥 DODAJ pustą linię po nagłówku (TO JEST KLUCZ)
  .replace(/(🔥.*?:)/g, "$1\n")
  .replace(/(⚠️.*?:)/g, "$1\n")
  .replace(/(👉.*?:)/g, "$1\n")

  // 🔥 normalizacja
  .replace(/\n{3,}/g, "\n\n")
  
  .replace(/•\s*/g, "\n• ")
  
  .replace(/•\s*/g, "\n• ")

  .trim();

/* ========= INTENT CONTROL ========= */

// ❌ nie nadpisuj jeśli już było trafne
if (intent !== "general") return finalOutput;

/* ========= BRAIN CONTROL ========= */

// ⚠️ ciężki temat (tylko start)
const isFirstTurn = history.length < 2;

// ❌ anty powtórki
if (finalOutput.includes("To nie jest lekka sytuacja") && history.length > 2) {
  finalOutput = baseText.trim();
}

/* ========= DECISION MEMORY ========= */

function getRecentDecision(profile: any) {
  if (!profile.decisions || profile.decisions.length === 0) return null;

  const last = profile.decisions[profile.decisions.length - 1];
  const hoursAgo = (Date.now() - last.createdAt) / (1000 * 60 * 60);

  // 👉 sensowny próg (np. 6h)
  if (hoursAgo > 6) {
    return last;
  }

  return null;
}

// 🔥 highlight (zostaje OK)
const actionStep = extractActionStep(finalOutput);

let highlight: string | null = null;

if (actionStep && actionStep.length > 10) {
  highlight = actionStep;
}

/* ========= SAVE ========= */

if (plan === "free") {
  await pushDemoMemory(userId, { role: "user", content: userText });
  await pushDemoMemory(userId, {
    role: "assistant",
    content: finalOutput,
  });
}

if (plan !== "free" && email && body?.chatId) {
  await appendChatMessageByEmail(email, body.chatId, {
    id: crypto.randomUUID(),
    role: "user",
    content: userText,
    createdAt: Date.now(),
  });

  await appendChatMessageByEmail(email, body.chatId, {
    id: crypto.randomUUID(),
    role: "assistant",
    content: finalOutput,
    createdAt: Date.now(),
  });
}

return new Response(
  JSON.stringify({ reply: finalOutput, highlight }),
  {
    headers: { "Content-Type": "application/json" },
  }
);
}
