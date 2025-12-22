import { ConversationMode } from "./conversationModes";

export function detectConversationMode(
  input: string,
  analysis: any
): ConversationMode {
  const text = input.toLowerCase();

  if (analysis?.clarity === "high" && analysis?.avoidance === false) {
    return "PAUSE";
  }

  if (analysis?.overload) {
    return "OVERLOADED";
  }

  if (analysis?.emotionalCharge === "high") {
    return "EMOTIONAL";
  }

  if (text.includes("?") && text.split(" ").length < 20) {
    return "CONCRETE";
  }

  if (
    text.includes("zastanawiam się") ||
    text.includes("czy to ma sens")
  ) {
    return "REFLECTION";
  }

  return "CASUAL";
}