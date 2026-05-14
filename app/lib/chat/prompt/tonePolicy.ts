export type ToneMode = "LIGHT" | "NEUTRAL";

export function detectToneMode(userMessage: string): ToneMode {
  const hardTopics = [
    "kod",
    "błąd",
    "error",
    "bug",
    "konfiguracja",
    "depresja",
    "lęk",
    "trauma",
    "śmierć",
    "choroba",
    "duchowo",
    "dusza",
    "świadomość",
    "przebudzenie",
    "sens istnienia",
  ];

  const lower = userMessage.toLowerCase();

  for (const t of hardTopics) {
    if (lower.includes(t)) {
      return "NEUTRAL";
    }
  }

  return "LIGHT";
}