import { UserAnalysis } from "./analysis";

export function buildSystemPrompt(
  basePrompt: string,
  analysis: UserAnalysis,
  memory?: any
) {
  let styleDirective = "";

  if (analysis.recommendedStyle === "direct") {
    styleDirective = `
Bądź bezpośredni.
Nazywaj rzeczy po imieniu.
Jeśli widzisz unikanie — nazwij je.
Nie pocieszaj i nie łagodź przekazu.
`;
  }

  if (analysis.recommendedStyle === "probing") {
    styleDirective = `
Zwolnij.
Zadaj jedno, precyzyjne pytanie zamiast wyjaśnień.
Nie prowadź użytkownika za rękę.
Pozwól mu samemu dotknąć sedna.
`;
  }

  if (analysis.recommendedStyle === "grounding") {
    styleDirective = `
Uprość.
Porządkuj zamiast analizować.
Nie normalizuj stanu.
Nie pocieszaj.

Jeśli rozmowa się rozjeżdża — zatrzymaj ją.
Jedno zdanie. Jedna myśl.
`;
  }

  let memoryBlock = "";

  if (memory) {
    memoryBlock = `
WZORCE Z POPRZEDNICH ROZMÓW (wewnętrzne, pomocnicze):

- Liczba powrotów: ${memory.visits}
- Powracające tematy: ${Object.keys(memory.coreThemes || {}).join(", ") || "brak"}
- Punkty napięcia: ${Object.keys(memory.tensions || {}).join(", ") || "brak"}
- Obszary unikania: ${Object.keys(memory.avoidances || {}).join(", ") || "brak"}

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

  return `
${basePrompt}

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

${styleDirective}
${memoryBlock}
`;
}