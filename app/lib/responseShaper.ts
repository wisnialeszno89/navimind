type ShapeInput = {
  text: string;
};

/**
 * Dzieli tekst na akapity
 */
function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Zostawia tylko pierwsze pytanie
 */
function ensureSingleQuestion(text: string) {
  const parts = text.split("?");
  if (parts.length <= 2) return text;

  return parts[0].trim() + "?";
}

/**
 * Twarde skrócenie długości
 */
function trimLength(text: string, max = 420) {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

/**
 * Usuwa typowe AI-wstępy
 */
function removeAiFluff(text: string) {
  return text.replace(
    /^(Rozumiem|Widzę|To brzmi|Dziękuję za podzielenie się|Masz rację|Czuję, że)[^.\n]*[.\n]+/i,
    ""
  );
}

/**
 * Zostawia maksymalnie:
 * 1 zdanie trafienia
 * 1 mikro-krok / 2 opcje
 * opcjonalnie 1 pytanie
 */
function compressMeaning(text: string) {
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // maks 3 zdania
  return sentences.slice(0, 3).join(" ");
}

/**
 * GŁÓWNY SILNIK KSZTAŁTOWANIA ODPOWIEDZI
 */
export function shapeResponse({ text }: ShapeInput) {
  if (!text) return "";

  let cleaned = text.trim();

  // 1. Usuń AI-wstępy
  cleaned = removeAiFluff(cleaned);

  // 2. Podziel na akapity i ogranicz chaos
  const paragraphs = splitParagraphs(cleaned);

  // maks 2 akapity → krócej = większa ulga
  const limited = paragraphs.slice(0, 2).join("\n\n");

  // 3. Kompresuj sens do max 3 zdań
  const compressed = compressMeaning(limited);

  // 4. Jedno pytanie maks
  const oneQuestion = ensureSingleQuestion(compressed);

  // 5. Twardy limit długości
  const finalText = trimLength(oneQuestion);

  return finalText;
}
