export type ConversationMode =
  | "casual"
  | "reflective"
  | "deep"
  | "technical"
  | "social";

export function detectConversationMode(
  text: string
): ConversationMode {
  const t = text.toLowerCase();

  if (
    /kod|typescript|nextjs|api|błąd|terminal|deploy/.test(t)
  ) {
    return "technical";
  }

  if (
    /ludzie|społeczeństwo|relacje|ego|zachowanie/.test(t)
  ) {
    return "social";
  }

  if (
    /świadomość|dusza|istnienie|sens/.test(t)
  ) {
    return "deep";
  }

  if (
    /czuję|mam dość|męczy/.test(t)
  ) {
    return "reflective";
  }

  return "casual";
}