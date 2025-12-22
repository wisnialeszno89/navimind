import { UserAnalysis } from "./analysis";

export function buildSystemPrompt(
  basePrompt: string,
  analysis: UserAnalysis,
  memory?: any
) {
  const styleDirective = getStyleDirective(analysis.recommendedStyle);
  const memoryBlock = buildMemoryBlock(memory);
  const contextBlock = buildContextBlock(analysis);

  return `
${basePrompt}

${contextBlock}
${styleDirective}
${memoryBlock}
`;
}

/* =========================
   STYLE
   ========================= */

function getStyleDirective(style?: string) {
  if (style === "direct") {
    return `
Bądź bezpośredni.
Nazywaj rzeczy po imieniu.
Jeśli widzisz unikanie — nazwij je.
Nie pocieszaj i nie łagodź przekazu.
`;
  }

  if (style === "probing") {
    return `
Zwolnij.
Zadaj jedno, precyzyjne pytanie zamiast wyjaśnień.
Nie prowadź użytkownika za rękę.
Pozwól mu samemu dotknąć sedna.
`;
  }

  if (style === "grounding") {
    return `
Uprość.
Porządkuj zamiast analizować.
Nie normalizuj stanu.
Nie pocieszaj.

Jeśli rozmowa się rozjeżdża — zatrzymaj ją.
Jedno zdanie. Jedna myśl.
`;
  }

  return "";
}

/* =========================
   CONTEXT
   ========================= */

function buildContextBlock(analysis: UserAnalysis) {
  return `
KONTEKST ROZMOWY (wewnętrzny):
Poniższe informacje służą wyłącznie do dopasowania tonu i formy.
Nie są diagnozą ani oceną.

- Ton emocjonalny: ${analysis.emotionalTone ?? "nieokreślony"}
- Intensywność: ${analysis.emotionalCharge ?? "średnia"}
- Klarowność: ${analysis.clarity ?? "średnia"}
- Unikanie: ${analysis.avoidance ? "tak" : "nie"}
- Główny temat: ${analysis.coreTheme ?? "nieokreślony"}
${analysis.tension ? `- Punkt napięcia: ${analysis.tension}` : ""}
${analysis.avoidance && analysis.avoidanceReason
    ? `- Co jest omijane: ${analysis.avoidanceReason}`
    : ""}
`;
}

/* =========================
   MEMORY
   ========================= */

function buildMemoryBlock(memory?: any) {
  if (!memory) return "";

  const themes = Object.keys(memory.coreThemes || {});
  const tensions = Object.keys(memory.tensions || {});
  const avoidances = Object.keys(memory.avoidances || {});

  return `
WZORCE Z POPRZEDNICH ROZMÓW (wewnętrzne, pomocnicze):

- Liczba powrotów: ${memory.visits}
- Powracające tematy: ${themes.length ? themes.join(", ") : "brak"}
- Punkty napięcia: ${tensions.length ? tensions.join(", ") : "brak"}
- Obszary unikania: ${avoidances.length ? avoidances.join(", ") : "brak"}

Jeśli widzisz, że rozmowa krąży wokół jednego tematu — nazwij to.
Jeśli użytkownik wraca w to samo miejsce — zatrzymaj go.

ZASADY JĘZYKA:
- Nie diagnozuj.
- Nie używaj etykiet psychologicznych.
- Nie tłumacz mechanizmów dłużej niż jedno zdanie.
- Jedno pytanie na odpowiedź — maksymalnie.
- Jeśli dalsze pytanie nic nie wnosi — nie zadawaj go.

ZASADA OBECNOŚCI:
- Mów jak ktoś, kto siedzi naprzeciwko.
- Nie bądź chłodny.
- Nie bądź mentorski.
`;
}

