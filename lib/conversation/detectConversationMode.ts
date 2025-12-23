import { ConversationMode } from "./conversationModes";

export function detectConversationMode(
  input: string,
  analysis: any
): ConversationMode {
  const text = input.toLowerCase();

  // 1️⃣ NAJPIERW PĘTLA – POWTARZANIE TEGO SAMEGO
  if (
    analysis?.avoidance === true &&
    analysis?.clarity === "low"
  ) {
    return "LOOP";
  }

  // 2️⃣ SILNE EMOCJE
  if (analysis?.emotionalCharge === "high") {
    return "EMOTIONAL";
  }

  // 3️⃣ PRZECIĄŻENIE
  if (analysis?.overload === true) {
    return "OVERLOADED";
  }

  // 4️⃣ REFLEKSJA
  if (
    text.includes("zastanawiam") ||
    text.includes("nie mogę przestać") ||
    text.includes("ciągle wracam")
  ) {
    return "REFLECTION";
  }

  // 5️⃣ KONKRETNE PYTANIE (DOPIERO TERAZ)
  if (text.includes("?") && text.split(" ").length < 20) {
    return "CONCRETE";
  }

  // 6️⃣ PAUZA TYLKO GDY NAPRAWDĘ JEST SPOKÓJ
  if (
    analysis?.clarity === "high" &&
    analysis?.avoidance === false &&
    analysis?.emotionalCharge !== "high"
  ) {
    return "PAUSE";
  }

  // 7️⃣ DOMYŚLNE
  return "CASUAL";
}