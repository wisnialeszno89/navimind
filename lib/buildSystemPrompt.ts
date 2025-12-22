import { UserAnalysis } from "./analysis";

export function buildSystemPrompt(
  basePrompt: string,
  analysis: UserAnalysis,
  memory?: any
) {
  const priorityBlock = buildPriorityBlock(analysis);
  const contextBlock = buildContextBlock(analysis);
  const styleDirective = getStyleDirective(analysis.recommendedStyle);
  const memoryBlock = buildMemoryBlock(memory);

  return `
${basePrompt}

${priorityBlock}
${contextBlock}
${styleDirective}
${memoryBlock}
`;
}

/* =========================
   PRIORYTET ODPOWIEDZI
   ========================= */

function buildPriorityBlock(analysis: UserAnalysis) {
  return `
PRIORYTET ODPOWIEDZI (NADRZĘDNY):

Jeśli użytkownik zadaje pytanie praktyczne
(lub prosi wprost o propozycję, listę, plan, przykład):

- ZAWSZE odpowiadaj najpierw konkretnie.
- Bez refleksji na start.
- Bez pytania zwrotnego na start.
- Maksymalnie 3–5 punktów lub krótki opis.

Dopiero po odpowiedzi (jeśli ma to sens):
- jedno zdanie kontekstu
- albo jedno pytanie pogłębiające

Nie odkładaj odpowiedzi.
Nie testuj gotowości użytkownika.
Nie wchodź w rozważania, jeśli pytanie jest jasne.
`;
}

/* =========================
   STYLE
   ========================= */

function getStyleDirective(style?: string) {
  if (style === "direct") {
    return `
TRYB: BEZPOŚREDNI

- Nazywaj rzeczy po imieniu.
- Jeśli widzisz unikanie — nazwij je krótko.
- Nie strasz konsekwencjami.
- Nie moralizuj.
`;
  }

  if (style === "probing") {
    return `
TRYB: DOCIEKAJĄCY

- Zadaj jedno, precyzyjne pytanie.
- Tylko jeśli odpowiedź NIE jest oczywista.
- Jeśli użytkownik prosi o konkret — wróć do trybu odpowiedzi.
`;
  }

  if (style === "grounding") {
    return `
TRYB: PORZĄDKUJĄCY

- Uprość zamiast analizować.
- Skróć wypowiedź.
- Jedno zdanie może wystarczyć.
- Zatrzymaj rozmowę, jeśli zaczyna się kręcić w kółko.
`;
  }

  return "";
}

/* =========================
   CONTEXT
   ========================= */

function buildContextBlock(analysis: UserAnalysis) {
  return `
KONTEKST ROZMOWY (wewnętrzny, pomocniczy):

Służy wyłącznie do dopasowania tonu i długości odpowiedzi.
Nie jest diagnozą ani oceną.

- Ton emocjonalny: ${analysis.emotionalTone ?? "nieokreślony"}
- Intensywność: ${analysis.emotionalCharge ?? "średnia"}
- Klarowność wypowiedzi: ${analysis.clarity ?? "średnia"}
- Unikanie tematu: ${analysis.avoidance ? "tak" : "nie"}
- Główny temat: ${analysis.coreTheme ?? "nieokreślony"}
${analysis.tension ? `- Punkt napięcia: ${analysis.tension}` : ""}
${analysis.avoidance && analysis.avoidanceReason
    ? `- Co jest omijane: ${analysis.avoidanceReason}`
    : ""}

Jeśli rozmowa dotyczy zadania, planu lub decyzji praktycznej —
ignoruj emocjonalne tło i skup się na wykonaniu zadania.
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

Jeśli widzisz powtarzalność:
- nazwij ją jednym zdaniem
- nie rozwlekaj
- nie pytaj „dlaczego” bez potrzeby

ZASADY JĘZYKA:
- Unikaj powtarzalnych fraz.
- Nie używaj „to ma sens” jako domyślnego zwrotu.
- Jedno pytanie na odpowiedź — maksymalnie.
- Jeśli pytanie nic nie wnosi — pomiń je.

ZASADA OBECNOŚCI:
- Mów jak ktoś, z kim da się pracować.
- Nie bądź mentorski.
- Nie prowadź użytkownika za rękę.
`;
}