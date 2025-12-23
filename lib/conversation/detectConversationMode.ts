import { ConversationMode } from "./conversationModes";

export function detectConversationMode(
  input: string,
  analysis: any
): ConversationMode {
  const text = input.toLowerCase();

  // 1️⃣ PĘTLA EMOCJONALNA – NAJWAŻNIEJSZE
  if (
    analysis?.emotionalCharge === "high" &&
    analysis?.clarity === "low" &&
    analysis?.repetition === true
  ) {
    return "LOOP";
  }

  // 2️⃣ PRZECIĄŻENIE
  if (analysis?.overload) {
    return "OVERLOADED";
  }

  // 3️⃣ SILNE EMOCJE (ALE JESZCZE NIE PĘTLA)
  if (analysis?.emotionalCharge === "high") {
    return "EMOTIONAL";
  }

  // 4️⃣ KONKRETNE PYTANIE
  if (text.includes("?") && text.split(" ").length < 20) {
    return "CONCRETE";
  }

  // 5️⃣ REFLEKSJA
  if (
    text.includes("zastanawiam się") ||
    text.includes("czy to ma sens")
  ) {
    return "REFLECTION";
  }

  // 6️⃣ PAUZA – JASNOŚĆ BEZ UNIKANIA
  if (analysis?.clarity === "high" && analysis?.avoidance === false) {
    return "PAUSE";
  }

  return "CASUAL";
}