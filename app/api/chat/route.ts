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
import { decideResponse } from "../../lib/decisionEngine";

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
  const decision = decideResponse(userText);
  const intent = {
  wantsRelief: /(nie chce|mam dość|przytłacza|bez sensu)/i.test(userText),
  wantsUnderstanding: /(dlaczego|czemu|jak to działa)/i.test(userText),
  wantsAction: /(co zrobić|co robic|jak ogarnąć|co dalej)/i.test(userText),
  };
  const tension = {
  conflict:
    /(chce.*ale|wiem.*ale|powinienem.*ale)/i.test(userText),

  emotionalLoad:
    userText.length > 200 ||
    /(nie mogę|ciągle wraca|męczy mnie|nie daje spokoju)/i.test(userText),
  };
  let responseDirection = "neutral";

if (intent.wantsAction) {
  responseDirection = "solution";
} else if (intent.wantsUnderstanding) {
  responseDirection = "explain";
} else if (intent.wantsRelief) {
  responseDirection = "release";
}

if (tension.conflict) {
  responseDirection = "conflict";
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

/* ========= AFTER HISTORY ========= */

const isFirstMessage = history.length === 0;

const memorySummary = history
  .slice(-6)
  .map((m) => (m.role === "user" ? `U: ${m.content}` : `A: ${m.content}`))
  .join("\n");

const userStyle = {
  isShort,
  isLong,
  isChaotic,
  isDirect,
};
let styleInstructions = "";
const contextBlock = `
AKTUALNA SYTUACJA:

Ostatnie wiadomości:
${memorySummary}

Obecny temat rozmowy:
"${userText.slice(0, 120)}"

Trzymaj się TEGO kontekstu.
Nie zmieniaj tematu bez powodu.
`;

if (userStyle.isShort) {
  styleInstructions += `
- odpowiadaj krótko
- jedno trafne zdanie wystarczy
`;
}

if (userStyle.isLong) {
  styleInstructions += `
- możesz wejść głębiej
- rozbij na 2–3 warstwy
`;
}

if (userStyle.isChaotic) {
  styleInstructions += `
- spowolnij tempo
- uprość przekaz
- jedna myśl na raz
`;
}

if (userStyle.isDirect) {
  styleInstructions += `
- konkretnie
- bez wstępów
`;
}

if (!styleInstructions) {
  styleInstructions = `
- zachowaj naturalne tempo
- mów jasno i prosto
`;
}

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

${contextBlock}

TRYB ROZMOWY:

${decision.type}

ZASADY GŁÓWNE:

- Trzymaj się aktualnego tematu rozmowy
- Nie powtarzaj tych samych schematów
- Nie zaczynaj każdej odpowiedzi tak samo
- Jeśli możesz powiedzieć prościej → powiedz prościej

STYL UŻYTKOWNIKA:

${userStyle.isShort ? "- pisze krótko" : ""}
${userStyle.isLong ? "- pisze długo" : ""}
${userStyle.isChaotic ? "- jest przeciążony" : ""}
${userStyle.isDirect ? "- chce konkretów" : ""}

ADAPTACJA:

${styleInstructions}

ZACHOWANIE (PRIORYTET):

answer →
- odpowiedz konkretnie
- bez wstępów
- bez zbędnej analizy

guide →
- pokaż kierunek
- pomóż zobaczyć coś szerzej
- bez lania wody

clarify →
- jedno krótkie pytanie
- tylko jeśli naprawdę potrzebne

slow →
- uprość odpowiedź
- jedna myśl na raz
- spokojne tempo

START ODPOWIEDZI:

- NIE zaczynaj od pytania
- najpierw interpretacja lub obserwacja
- pytanie tylko później, jeśli ma sens

UNIKAJ:

- moralizowania
- "odpowiedzialność jest kluczem"
- brzmiących jak poradnik zdań

TON:

- mów jak człowiek, nie jak ekspert
- możesz być bezpośredni
- krótkie zdania są lepsze niż idealne zdania

PYTANIA:

- nie zadawaj pytania automatycznie
- jeśli użytkownik pyta → najpierw odpowiedz
- pytanie tylko jeśli wnosi wartość
- możesz zakończyć bez pytania

KONTROLA:

- jeśli odpowiedź robi się za długa → skróć
- jeśli robi się zbyt ogólna → urealnij
- jeśli temat jest jeden → nie rozbijaj go na wiele

INTENCJA:

- ulga: ${intent.wantsRelief}
- zrozumienie: ${intent.wantsUnderstanding}
- działanie: ${intent.wantsAction}
conflict →
- nazwij konflikt wprost (bez ogólnych słów)
- pokaż co dokładnie się ściera (konkret vs konkret)
- unikaj fraz typu: "sprzeczność", "to normalne", "klasyczne"
- nie tłumacz zjawiska — pokaż je na przykładzie tej sytuacji

SIŁA ODPOWIEDZI:

- lepiej powiedzieć jedną trafną rzecz niż trzy poprawne
- unikaj bezpiecznych, ogólnych sformułowań
- odpowiedź ma trafić, nie tylko być poprawna

PRIORYTET:

Jeśli wykrywasz konflikt → nazwij go w pierwszym zdaniu.

Nie tłumacz go najpierw.
Nie analizuj.
Najpierw pokaż.

NAPIĘCIE:

- konflikt: ${tension.conflict}
- obciążenie: ${tension.emotionalLoad}

UNIKAJ OGÓLNIKÓW:

- nie używaj: "to normalne", "to klasyczne", "to sprzeczność"
- każda odpowiedź ma odnosić się do konkretu z wypowiedzi użytkownika

KIERUNEK ODPOWIEDZI:

${responseDirection}

Nie mieszaj trybów.
Trzymaj jedną spójną odpowiedź.
`;

  /* ========= OPENAI ========= */

  const { default: OpenAI } = await import("openai");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.8,
    max_tokens: 1500,
    messages: [
  { role: "system", content: systemPrompt },
  ...history,
  { role: "user", content: userText },
  ],
  });

  let fullText = response.choices?.[0]?.message?.content || "";
  // 🔥 FIX: ucięte odpowiedzi
  if (fullText && !/[.!?]$/.test(fullText.trim())) {
  const lastDot = fullText.lastIndexOf(".");
  if (lastDot > 100) {
    fullText = fullText.slice(0, lastDot + 1);
  }
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