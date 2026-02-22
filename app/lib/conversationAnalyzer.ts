export type ConversationMode =
  | "stabilize"
  | "clarify"
  | "confront"
  | "realism";

export function analyzeConversation(
  userText: string,
  history: { role: string; content: string }[]
): ConversationMode {
  const text = userText.toLowerCase();

  const highEmotion =
    /(boję|nienawidzę|mam dość|nie wytrzymam|to boli|bez sensu|jestem załamany)/i.test(
      text
    );

  const blameLanguage =
    /(ona|on|oni|zawsze|nigdy|wszyscy|to przez)/i.test(text);

  const lastUserMessages = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content.toLowerCase());

  const repeatedTopic = lastUserMessages.some((msg) =>
    msg.slice(0, 40) === text.slice(0, 40)
  );

  if (highEmotion) return "stabilize";
  if (repeatedTopic) return "clarify";
  if (blameLanguage) return "confront";

  return "realism";
}