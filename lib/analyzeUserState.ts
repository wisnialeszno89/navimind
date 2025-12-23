import OpenAI from "openai";
import { UserAnalysis } from "./analysis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Msg = {
  role: "user" | "assistant";
  content: string;
};

// 🔁 PROSTA HEURYSTYKA PĘTLI
function detectRepetition(messages: Msg[]): boolean {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase());

  if (userMessages.length < 2) return false;

  const last = userMessages[userMessages.length - 1];
  const prev = userMessages[userMessages.length - 2];

  const normalize = (s: string) =>
    s
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

  const a = normalize(last);
  const b = normalize(prev);

  if (a.length === 0 || b.length === 0) return false;

  const overlap = a.filter((w) => b.includes(w)).length;
  const ratio = overlap / Math.min(a.length, b.length);

  return ratio > 0.6; // 🔑 kluczowy próg
}

export async function analyzeUserState(
  history: Msg[]
): Promise<UserAnalysis> {
  // analizujemy tylko świeży kontekst
  const recent = history.slice(-6);

  const repetition = detectRepetition(recent);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
Jesteś WARSTWĄ ANALITYCZNĄ.
NIE odpowiadasz użytkownikowi.
NIE prowadzisz rozmowy.
NIE pocieszasz.

Twoim zadaniem jest przeanalizować STAN użytkownika
na podstawie ostatnich wiadomości.

Zwróć WYŁĄCZNIE czysty JSON w formacie:

{
  "emotionalTone": "calm | anxious | frustrated | overwhelmed | numb",
  "emotionalCharge": "low | medium | high",
  "clarity": "high | medium | low",
  "avoidance": boolean,

  "coreTheme": "główny temat rozmowy (1–3 słowa)",
  "tension": "gdzie rozmowa się napina (opcjonalne)",
  "avoidanceReason": "co jest omijane (opcjonalne)",
  "anchor": "jedno zdanie warte zapamiętania (opcjonalne)",

  "recommendedStyle": "direct | probing | grounding"
}

Zasady:
- coreTheme opisuje O CZYM to jest, nie problem
- tension to miejsce utknięcia, nie emocja
- avoidanceReason tylko jeśli avoidance = true
- anchor tylko jeśli coś WYRAŹNIE wraca lub jest kluczowe
- to są HIPOTEZY, nie diagnozy
- zero komentarzy, zero markdown, zero tekstu poza JSON
        `.trim(),
      },
      ...recent,
    ],
  });

  const raw = completion.choices[0]?.message?.content;

  // 🔒 BEZPIECZNY FALLBACK
  if (!raw) {
    return {
      emotionalTone: "calm",
      emotionalCharge: "low",
      clarity: "medium",
      avoidance: false,

      coreTheme: "brak danych",
      tension: undefined,
      avoidanceReason: undefined,
      anchor: undefined,

      recommendedStyle: "probing",
      repetition,
    };
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      emotionalTone: parsed.emotionalTone ?? "calm",
      emotionalCharge: parsed.emotionalCharge ?? "medium",
      clarity: parsed.clarity ?? "medium",
      avoidance: Boolean(parsed.avoidance),

      coreTheme: parsed.coreTheme ?? "brak danych",
      tension: parsed.tension,
      avoidanceReason: parsed.avoidance ? parsed.avoidanceReason : undefined,
      anchor: parsed.anchor,

      recommendedStyle: parsed.recommendedStyle ?? "probing",
      repetition,
    };
  } catch {
    return {
      emotionalTone: "overwhelmed",
      emotionalCharge: "high",
      clarity: "low",
      avoidance: true,

      coreTheme: "dezorientacja",
      tension: "krążenie wokół jednego punktu",
      avoidanceReason: "wejście w sedno",
      anchor: undefined,

      recommendedStyle: "grounding",
      repetition,
    };
  }
}