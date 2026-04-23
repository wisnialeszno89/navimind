export type ResponseDepth = "short" | "medium" | "deep";

export function detectResponseDepth(
  userText: string,
  historyLength: number
): ResponseDepth {
  const text = userText.toLowerCase();

  const shortSignal =
    text.length < 60 ||
    /(co robić|i co teraz|jak to ogarnąć|co dalej)/i.test(text);

  const deepSignal =
    text.length > 200 ||
    /(nie wiem co czuję|mam chaos|wszystko się sypie|nie ogarniam życia)/i.test(
      text
    );

  if (deepSignal) return "deep";
  if (shortSignal) return "short";

  // im dłuższa rozmowa → tym bardziej konkretnie
  if (historyLength > 8) return "short";

  return "medium";
}