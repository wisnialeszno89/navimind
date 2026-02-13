export type IntentType = "CLOSED" | "OPEN";

export function classifyIntent(userMessage: string): IntentType {
  const closedTriggers = [
    "napisz",
    "opowiedz",
    "stwórz",
    "wygeneruj",
    "zrób",
    "przygotuj",
    "bajkę",
    "historię",
    "opis",
    "instrukcję",
    "analizę",
    "podsumowanie",
  ];

  const lower = userMessage.toLowerCase();

  for (const t of closedTriggers) {
    if (lower.includes(t)) {
      return "CLOSED";
    }
  }

  return "OPEN";
}