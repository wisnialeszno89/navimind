export type ConversationMode = "casual" | "reflective" | "deep";

export function detectConversationMode(
  userText: string,
  analysis: any,
  history: any[]
): ConversationMode {
  const lower = userText.toLowerCase();

  // 🟢 CASUAL
  if (
    lower.length < 120 &&
    !/problem|co zrobić|jak|pomóż|decyzja/.test(lower)
  ) {
    return "casual";
  }

  // 🟡 REFLECTIVE
  if (
    /dlaczego|czemu|po co/.test(lower) ||
    analysis.state === "emotional"
  ) {
    return "reflective";
  }

  // 🔴 DEEP
  return "deep";
}