export type ConversationPhase =
  | "explore"
  | "understand"
  | "direction";

export function detectConversationPhase(
  history: any[]
): ConversationPhase {
  const userMessages = history.filter(
    (m) => m.role === "user"
  );

  // krótka rozmowa
  if (userMessages.length < 4) {
    return "explore";
  }

  const combined = userMessages
    .slice(-8)
    .map((m) => m.content.toLowerCase())
    .join(" ");

  // user powtarza problem
  const repeated =
    /ciągle|zbyt długo|cały czas|w kółko|nie da się|nic się nie zmienia/.test(
      combined
    );

  if (repeated) {
    return "direction";
  }

  return "understand";
}