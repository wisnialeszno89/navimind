import { getPersonalityStyle } from "../../lib/personalityEngine";
import { buildResourcePrompt } from "../../lib/smartResources";
import { getUserProfile, updateUserProfile } from "../../lib/userProfile";
import { checkAndIncrementLimit } from "../../lib/chatLimit";
import { extractActionStep } from "../../lib/nextStepEngine";
import { detectUserStyle } from "../../lib/personalityEngine";
import { detectTopic } from "../../lib/topicEngine";
import { saveTopic, getTopics } from "../../lib/userMemory";
import { detectDecisionMoment, getDecisionNudge } from "../../lib/decisionEngine";
import { detectProgress } from "../../lib/progressEngine";
import { buildSystemPrompt } from "../../lib/conversation/buildSystemPrompt";
import { detectConversationMode } from "../../lib/conversation/detectConversationMode";
import { detectResponseStrategy } from "../../lib/conversation/detectResponseStrategy";
import { analyzeConversationStep } from "../../lib/conversationInsights";
import { setLastActive, getLastActive } from "../../lib/lastActive";
import { shapeResponse } from "../../lib/responseShaper";
import { detectPattern } from "../../lib/patternEngine";
import { savePattern, getPatterns } from "../../lib/userMemory";
import { predictNext } from "../../lib/predictEngine";
import { scoreConversationStep, saveScore } from "../../lib/conversationScore";
import { setRelationAnchor, getRelationAnchor } from "../../lib/contextAnchor";
import { setUserStyle, getUserStyle } from "../../lib/userMemory";
import { detectUserType } from "../../lib/psychologyEngine";
import { setUserType, getUserType } from "../../lib/userMemory";
import { detectResponseType } from "../../lib/responseType";
import { refineResponse } from "../../lib/responseShaper";
import { detectIntent } from "../../lib/brainRouter";
import { buildConversationSummary } from "../../lib/conversationSummary";

import { extractContextAnchor } from "../../lib/contextAnchor";
import { saveMicroDetail, getMicroDetail } from "../../lib/userMemory";
import { updateUserIdentity, getUserIdentity } from "../../lib/userIdentity";
import { updateContextAnchor, getContextAnchor } from "../../lib/userMemory";
import { getRecentEffects, saveEffect } from "../../lib/effectMemory";
import {
  detectMode,
  isLooping,
  shouldAllowQuestion,
  isFirstHeavyMessage
} from "@/lib/brainRouter";
import { buildTone } from "../../lib/buildTone";
import { getNextStep } from "../../lib/nextStepEngine";
// import { buildSystemPrompt } from "@/lib/buildSystemPrompt";
import { updateMemory, getMemory, updateCoreMemory, getCoreMemory,saveAction,getActions, } from "../../lib/userMemory";

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
  import { detectActionIntent } from "../../lib/actionRouter";
  

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

function detectFlowStage(
  analysis: any,
  history: any[]
) {
  const lastMessages = history
    .slice(-3)
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();

  if (
    /wybieram|biorę|ok|dobra|idziemy|robimy/.test(
      lastMessages
    )
  ) {
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

function isDependentFollowup(text: string) {
  const t = text
    .trim()
    .toLowerCase();

  return (
    t.length < 25 &&
    /^(ale )?(po co|dlaczego|czemu|czyli|i co|i\?|to po co|serio|no ale|i wtedy|i co wtedy)/i.test(
      t
    )
  );
}function buildFollowupHint(
  userText: string,
  lastAssistant: string
) {
  const t = userText
    .trim()
    .toLowerCase();

  const last = lastAssistant
    .slice(-1200)
    .toLowerCase();

  // 🔥 PYTANIE O POWÓD
  if (
    /^(ale )?(po co|dlaczego|czemu)\??$/.test(
      t
    )
  ) {
    return `
User pyta o POWÓD lub MOTYW
mechanizmu opisanego wcześniej.

NIE zmieniaj tematu.
NIE odpowiadaj ogólnie.
NIE dawaj porad życiowych.

Masz wyjaśnić:
DLACZEGO ludzie robią to,
o czym była poprzednia odpowiedź.

Odpowiadasz bez dopytywania.
`;
  }

  // 🔥 NIE ROZUMIE
  if (
    /nie rozumiem|bez sensu|co\?/.test(t)
  ) {
    return `
User nie zrozumiał
POPRZEDNIEGO mechanizmu.

Wyjaśnij prościej tę samą myśl.
Nie zmieniaj tematu.
`;
  }

  // 🔥 OGÓLNY FOLLOWUP
  return `
To jest kontynuacja
ostatniego tematu.

Kontynuuj poprzednią myśl,
a nie zaczynaj nowej rozmowy.
`;
}
export async function POST(req: Request) {
  const userId = getUserId();

  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "UNAUTHORIZED",
      }),
      {
        status: 401,
      }
    );
  }

  const email = getSessionEmail();
  const plan = await getUserPlan();

  // 🔥 LIMIT
  if (plan === "free") {
    const limit =
      await checkAndIncrementLimit(userId);

    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          error: "LIMIT_REACHED",
          used: limit.used,
          limit: limit.limit,
          resetAt: limit.resetAt,
        }),
        {
          status: 403,
        }
      );
    }
  }

  const body = await req
    .json()
    .catch(() => null);

  const userText: string = String(
    body?.message || ""
  ).trim();

  const actionIntent =
    detectActionIntent(userText);

  const pattern = detectPattern(userText);

  if (pattern) {
    await savePattern(userId, pattern);
  }

  const patterns = await getPatterns(userId);

  const topic = detectTopic(userText);

  if (topic) {
    await saveTopic(userId, topic);
  }

  await saveMicroDetail(
    userId,
    userText
  );

  if (!userText) {
    return new Response(
      JSON.stringify({
        error: "NO_MESSAGE",
      }),
      {
        status: 400,
      }
    );
  }

  const lower =
    userText.toLowerCase();

// 🔥 SMALL TALK / LIGHT MODE (JEDYNY FILTR)
const isGreeting =
  /^(hej|siema|elo|yo|haha|xd|ok|okej|no|test)$/i.test(lower);

const isWhoQuestion =
  /kim jestes|kim jesteś|kto ty|co ty/i.test(lower);

if (lower.length < 40 && (isGreeting || isWhoQuestion)) {
  let reply = "Hej 🙂 Co u Ciebie?";

  if (isWhoQuestion) {
    reply = "Jestem tu, żeby pomóc Ci ogarnąć to, co masz na głowie. Bez spiny 🙂";
  }

  return new Response(
    JSON.stringify({ reply }),
    { headers: { "Content-Type": "application/json" } }
  );
}
let history: ChatMsg[] = [];
/* ========= HISTORY ========= */
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
// 🔥 PSYCHOLOGIA USERA (TU WŁAŚNIE)
const historyTexts = history.map((m: any) => m.content);

const detectedType = detectUserType(userText, historyTexts);
await setUserType(userId, detectedType);

const userType = (await getUserType(userId)) || "talker";
// 👇 dopiero tutaj zaczyna się normalny flow
const analysis = analyzeUserMessage(userText);
const isSensitive =
  analysis.state === "emotional" ||
  analysis.state === "kryzys";
if (userText.length > 40 && analysis.state !== "low") {
  await setRelationAnchor(userId, userText);
}

const detectedStyle = detectUserStyle(userText);
await setUserStyle(userId, detectedStyle);

const persistentStyle = (await getUserStyle(userId)) || "direct";
const topics = await getTopics(userId);
const relationAnchor = (await getRelationAnchor(userId)) || undefined;

const progress = detectProgress(userText, historyTexts);
function detectStyle(userText: string, analysis: any) {
  const lower = userText.toLowerCase();
  
  // 🟢 casual (rozmowa)
 const isGreeting =
  /^(hej|siema|elo|yo)$/i.test(lower);

const isShortReply =
  /^(ok|okej|no|haha|xd)$/i.test(lower);

if (isGreeting && history.length < 2) {
  return new Response(
    JSON.stringify({ reply: "Hej 🙂 Co u Ciebie?" }),
    { headers: { "Content-Type": "application/json" } }
  );
}

if (isShortReply) {
  return new Response(
    JSON.stringify({
      reply: "No właśnie 😄",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

  // 🟡 refleksja
  if (
    analysis.state === "emotional" ||
    /dlaczego|czemu|po co/.test(lower)
  ) {
    return "reflective";
  }

  // 🔴 deep analiza
  return "deep";
}


const styleMode = detectStyle(userText, analysis);
const intent = "general";
const responseType = detectResponseType(userText, analysis);

updateUserProfile(userId, analysis);

const userProfile = getUserProfile(userId);
const prediction = predictNext(userText, patterns);
const isDecision = detectDecisionMoment(userText);
const decisionNudge = isDecision ? getDecisionNudge(userText) : null;
if (decisionNudge) {
  await saveAction(userId, decisionNudge);
}
const actions = await getActions(userId);

/* ========= MEMORY ========= */

updateMemory(userId, userText);
await saveMicroDetail(userId, userText);
updateUserIdentity(userId, userText);

const identity = getUserIdentity(userId);
const memory = getMemory(userId);

const lastActive = await getLastActive(userId);

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
const personality = getPersonalityStyle(analysis, userText);

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
  ...history.slice(-8),
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

const microDetail = await getMicroDetail(userId);
// 🔹 SYSTEM PROMPT
const mode =
  detectConversationMode(userText);

const strategy =
  detectResponseStrategy({
    userText,
    mode,
  });

const systemPrompt = buildSystemPrompt({
  mode,
  strategy,
  memory,
  contextBlock,
  summary,
  continuationHint,
});
if (actionIntent === "generate_pdf") {
  return new Response(
    JSON.stringify({
      action: "generate_pdf",
      content: userText,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

console.log({
  mode,
  strategy,
  userText,
});
const shortFollowup =
  isDependentFollowup(userText);

let contextualUserText = userText;

if (
  shortFollowup &&
  history.length > 0
) {
  const lastAssistant = history
    .filter((m) => m.role === "assistant")
    .slice(-1)[0]?.content;

  contextualUserText = `
KONTEKST POPRZEDNIEJ ODPOWIEDZI:
${lastAssistant}

NOWA WIADOMOŚĆ USERA:
${userText}

Ta wiadomość jest kontynuacją
poprzedniego tematu.

NIE pytaj użytkownika:
- "co masz na myśli?"
- "o co chodzi?"
- "możesz doprecyzować?"

Samodzielnie wywnioskuj,
do czego odnosi się pytanie.

Zinterpretuj krótką wiadomość
w kontekście poprzedniej rozmowy.
`;
}
const response = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  temperature: 0.7,
  max_tokens: 1200,
  messages: [
  {
    role: "system",
    content: systemPrompt,
  },

  ...history,

  ...(isDependentFollowup(userText)
  ? [
      {
        role: "system" as const,
        content: buildFollowupHint(
      userText,
      lastAssistant || ""
      ),
      },
    ]
  : []),

  {
    role: "user",
    content: userText,
  },
],
});
let baseText = response.choices?.[0]?.message?.content || "";

const recentEffects = await getRecentEffects(userId);

 // 🔥 RESPONSE SHAPER
const { text, usedEffect } = shapeResponse({
  text: baseText,
  userText,
  mode,
  userStyle: persistentStyle,
  userType,
});

// 🔥 TEKST
let finalOutput = text;

// 🔥 ZAPIS EFEKTU (TYLKO RAZ!)
if (usedEffect) {
  await saveEffect(userId, usedEffect);
}
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

finalOutput = finalOutput
  .replace(/\n{3,}/g, "\n\n")
  .trim();

finalOutput = formatResponse(finalOutput);
  // 🔥 ANALIZA (TU!)

const insight = analyzeConversationStep(userText, finalOutput);

const score = scoreConversationStep(userText, finalOutput);

// finalOutput = refineResponse(finalOutput, score);

await saveScore(userId, score, plan);

console.log("SCORE", score);

await saveScore(userId, score, plan);

console.log("INSIGHT", {
  user: userText,
  ai: finalOutput,
  insight,
});

console.log("SCORE", score);
const isDrop =
  userText.length < 10 &&
  /ok|haha|xd|no/.test(userText.toLowerCase());

console.log("DROP?", isDrop);

// 🔥 AKTYWNOŚĆ
await setLastActive(userId);

// 🔥 RETURN
if (intent !== "general") {
  return new Response(
    JSON.stringify({ reply: finalOutput }),
    { headers: { "Content-Type": "application/json" } }
  );
}

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
