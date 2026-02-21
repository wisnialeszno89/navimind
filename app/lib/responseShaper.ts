type ShapeInput = {
  text: string;
  softLimit?: boolean;
};

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function ensureSingleQuestion(text: string) {
  const parts = text.split("?");
  if (parts.length <= 2) return text;
  return parts[0].trim() + "?";
}

function trimLength(text: string, max = 420) {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

function removeAiFluff(text: string) {
  return text.replace(
    /^(Rozumiem|Widzę|To brzmi|Dziękuję za podzielenie się|Masz rację|Czuję, że)[^.\n]*[.\n]+/i,
    ""
  );
}

function compressMeaning(text: string) {
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.slice(0, 3).join(" ");
}

export function shapeResponse({ text, softLimit }: ShapeInput) {
  if (!text) return "";

  let cleaned = text.trim();
  cleaned = removeAiFluff(cleaned);

  const paragraphs = splitParagraphs(cleaned);
  const limited = paragraphs.slice(0, 2).join("\n\n");

  const compressed = compressMeaning(limited);
  const oneQuestion = ensureSingleQuestion(compressed);

  let finalText = trimLength(oneQuestion);

  if (softLimit && finalText.length > 300) {
    finalText = finalText.slice(0, 280) + "...";
  }

  return finalText;
}
