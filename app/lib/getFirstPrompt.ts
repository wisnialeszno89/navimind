import type { FirstState } from "./detectFirstState";

export function getFirstPrompt(state: FirstState, lang: "pl" | "en") {
  if (lang === "pl") {
    switch (state) {
      case "anxiety":
        return `
Twoja pierwsza odpowiedź musi być bardzo spokojna i krótka.

Struktura:
1. Najpierw jedno zdanie dające poczucie bezpieczeństwa i zatrzymania.
2. Potem jedno krótkie zdanie pokazujące, że jesteś obok.
3. Na końcu jedno bardzo proste pytanie otwierające rozmowę.

Bez porad. Bez analiz. Bez długich wypowiedzi.
Dużo ciszy i spokoju między słowami.
`;

      case "chaos":
        return `
Twoja pierwsza odpowiedź ma wprowadzić spokój i porządek.

Struktura:
1. Jedno spokojne zdanie zatrzymujące tempo.
2. Jedno zdanie pokazujące, że można to poukładać krok po kroku.
3. Na końcu 1 konkretne, proste pytanie.

Bez patosu. Bez moralizowania. Naturalny ton.
`;

      case "sadness":
        return `
Twoja pierwsza odpowiedź musi być bardzo ciepła i delikatna.

Struktura:
1. Jedno zdanie pełne obecności i zrozumienia.
2. Jedno zdanie pokazujące, że nie są z tym sami.
3. Na końcu bardzo łagodne pytanie.

Zero szybkich rozwiązań. Najpierw bycie obok.
`;

      default:
        return `
Spokojna, naturalna pierwsza odpowiedź.

Struktura:
1. Krótkie zdanie obecności.
2. Jedno zdanie spokojnego wsparcia.
3. Proste pytanie otwierające rozmowę.

Bez przesadnej emocjonalności. Bez sztuczności.
`;
    }
  }

  // EN
  switch (state) {
    case "anxiety":
      return `
Your first reply must be very calm and short.

Structure:
1. One sentence creating safety and slowing things down.
2. One sentence showing you are here with them.
3. One very simple opening question.

No advice. No analysis. Keep it gentle and quiet.
`;

    case "chaos":
      return `
Your first reply should bring calm and structure.

Structure:
1. One calming sentence.
2. One sentence showing things can be organized step by step.
3. One clear, simple question.

No drama. Natural tone.
`;

    case "sadness":
      return `
Your first reply must feel warm and gentle.

Structure:
1. One sentence of presence and understanding.
2. One sentence showing they are not alone.
3. One soft question.

No quick solutions. Presence first.
`;

    default:
      return `
Calm, natural opening reply.

Structure:
1. Short sentence of presence.
2. One sentence of quiet support.
3. Simple opening question.
`;
  }
}
