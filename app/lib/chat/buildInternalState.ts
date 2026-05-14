type Input = {
  userText: string;
  history: any[];
  intelligence: any;
};

export function buildInternalState({
  userText,
  history,
  intelligence,
}: Input) {
  const lower =
    userText.toLowerCase();

  const historyLength =
    history.length;

  const emotionalTension =
    /nie daje rady|chaos|boje|lęk|panic|samotn/i.test(
      lower
    )
      ? "high"
      : "normal";

  const clarityLevel =
    /nie wiem|sam nie wiem|chaos|pogub/i.test(
      lower
    )
      ? "low"
      : "normal";

  const conversationDepth =
    historyLength > 20
      ? "deep"
      : historyLength > 8
      ? "medium"
      : "light";

  const trustLevel =
    historyLength > 15
      ? "high"
      : historyLength > 5
      ? "medium"
      : "low";

  return {
    emotionalTension,
    clarityLevel,
    conversationDepth,
    trustLevel,
  };
}