import { ConversationMode } from "./conversationModes";

export function detectConversationMode(
  input: string,
  analysis: any
): ConversationMode {
  const text = input.toLowerCase();

  // 1️⃣ PĘTLA – wracanie w to samo miejsce
  // priorytet najwyższy
  if (
    analysis?.avoidance === true &&
    analysis?.clarity === "low"
  ) {
    return "LOOP";
  }

  // 2️⃣ EMOCJE
  if (analysis?.emotionalCharge === "high") {
    return "EMOTIONAL";
  }

  // 3️⃣ KONKRET
  if (
    text.includes("?") ||
    text.startsWith("jak ") ||
    text.startsWith("co ") ||
    text.startsWith("zrób") ||
    text.startsWith("podaj") ||
    text.startsWith("wymyśl")
  ) {
    return "CONCRETE";
  }

  // 4️⃣ DOMYŚLNE – rozmowa
  return "CASUAL";
}