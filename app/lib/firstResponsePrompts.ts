import type { FirstState } from "./detectFirstState";

export function getFirstPrompt(state: FirstState, lang: "pl" | "en") {
  if (lang === "pl") {
    switch (state) {
      case "anxiety":
        return `
Odpowiadasz bardzo spokojnie.
Krótkie zdania.
Najpierw pomóż się zatrzymać i poczuć bezpiecznie.
Zero porad na początku.
Dużo empatii.
`;

      case "chaos":
        return `
Bądź spokojny i rzeczowy.
Pomóż uporządkować sytuację.
Zadaj 1-2 konkretne pytania.
Bez patosu.
`;

      case "sadness":
        return `
Bądź bardzo ciepły i delikatny.
Pokaż obecność.
Nie dawaj szybkich rozwiązań.
Najpierw zrozumienie.
`;

      default:
        return `
Spokojna, mądra rozmowa.
Naturalny ton.
Bez przesadnej emocjonalności.
`;
    }
  }

  // EN
  switch (state) {
    case "anxiety":
      return `
Respond very calmly.
Short sentences.
Help them feel safe first.
No advice at the beginning.
`;

    case "chaos":
      return `
Be calm and structured.
Help organize the situation.
Ask 1-2 clear questions.
`;

    case "sadness":
      return `
Be warm and gentle.
Focus on presence, not solutions.
`;

    default:
      return `
Calm, natural conversation.
`;
  }
}
