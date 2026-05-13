export function getNextStep(analysis: any, userText: string): string | null {
  const t = userText.toLowerCase();

  /* ========= DISCOVERY (miejsca, wyjazdy) ========= */
  if (analysis.intent === "discovery") {
    return "wybierz 1–2 miejsca z listy i zaplanuj prostą trasę (max 2–3 godziny), bez przeładowania";
  }

  /* ========= AUTO / TECHNIKA ========= */
  if (/auto|samochód|silnik|olej|napraw|usterka/.test(t)) {
    return "znajdź konkretny tutorial dla swojego modelu auta i przejdź krok po kroku zamiast zgadywać";
  }

  /* ========= ZDROWIE ========= */
  if (/badania|lekarz|objawy|tarczyca/.test(t)) {
    return "umów konkretne badanie lub wizytę zamiast analizować objawy w nieskończoność";
  }

  /* ========= PRACA / PIENIĄDZE ========= */
  if (/praca|zarabiać|pieniądze|biznes/.test(t)) {
    return "wybierz jedną opcję zarobku i przetestuj ją w praktyce przez 48h";
  }

  /* ========= RUMINACJE ========= */
  if (analysis.loop === "ruminacje") {
    return "przerwij myślenie i zrób coś fizycznego (ruch, wyjście, działanie)";
  }

  /* ========= BRAK KIERUNKU ========= */
  if (analysis.need === "kierunek") {
    return "wybierz jedną opcję i sprawdź ją od razu zamiast analizować kolejne";
  }

  return null;
}
export function extractActionStep(text: string): string | null {
  const lines = text.split("\n");

  for (const line of lines) {
    const l = line.toLowerCase();

    if (
      l.includes("zrób") ||
      l.includes("spróbuj") ||
      l.includes("zacznij") ||
      l.includes("idź") ||
      l.includes("zadzwoń")
    ) {
      return line.replace(/^[-•\d.\s]*/, "").trim();
    }
  }

  return null;
}
export function extractOptions(text: string): string[] {
  if (
  text.includes("http://") ||
  text.includes("https://") ||
  text.includes("](")
) {
  return [];
}
  const lines = text.split("\n");

  return lines
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s/.test(l))
    .slice(0, 3);
}export function extractChosenOption(userText: string, lastAssistantMessage: string) {
  const match = userText.match(/\b(1|2|3)\b/);

  if (!match) return null;

  const index = Number(match[1]);

  const lines = lastAssistantMessage.split("\n");

  const optionLine = lines.find((l) =>
    l.trim().startsWith(index + ".")
  );

  if (!optionLine) return null;

  return optionLine.replace(/^\d+\.\s*/, "").trim();
}