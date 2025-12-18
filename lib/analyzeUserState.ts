import OpenAI from "openai";
import { UserAnalysis } from "./analysis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Msg = {
  role: "user" | "assistant";
  content: string;
};

export async function analyzeUserState(
  history: Msg[]
): Promise<UserAnalysis> {
  // bierzemy tylko ostatnie wiadomości – nie analizujemy całej epopei
  const recent = history.slice(-6);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    messages: ([
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
  "clarity": "high | medium | low",
  "avoidance": boolean,
  "coreIssue": "krótka hipoteza (max 8 słów)",
  "recommendedStyle": "direct | probing | grounding"
}

Zasady:
- Jeśli użytkownik krąży, omija sedno → avoidance = true
- Jeśli emocje dominują nad treścią → clarity = low
- coreIssue to HIPOTEZA, nie diagnoza
- zero komentarzy, zero markdown, zero tekstu poza JSON
        `.trim(),
      },
      ...recent,
    ] as any),
  });

  const raw = completion.choices[0]?.message?.content;

  if (!raw) {
    return {
      emotionalTone: "calm",
      clarity: "medium",
      avoidance: false,
      coreIssue: "brak danych",
      recommendedStyle: "probing",
    };
  }

  try {
    return JSON.parse(raw) as UserAnalysis;
  } catch (err) {
    // fallback – lepiej bezpiecznie niż głupio
    return {
      emotionalTone: "overwhelmed",
      clarity: "low",
      avoidance: true,
      coreIssue: "chaos poznawczy",
      recommendedStyle: "grounding",
    };
  }
}