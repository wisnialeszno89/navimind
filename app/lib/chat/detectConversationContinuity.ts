type Input = {
  userText: string;
  history: any[];
};

export function detectConversationContinuity({
  userText,
  history,
}: Input) {
  const lower =
    userText.toLowerCase();

  const shortMessage =
    lower.length < 120;

  const continuationPatterns =
    [
      "a co",
      "czyli",
      "ale",
      "no dobra",
      "to co",
      "i co",
      "czemu",
      "dlaczego",
      "jak to",
      "czy to",
      "ma sens",
      "serio",
      "czyli co",
      "rozwiń",
      "wytłumacz",
    ];

  const looksLikeContinuation =
    continuationPatterns.some(
      (p) =>
        lower.includes(p)
    );

  const hasHistory =
    history.length > 0;

  return {
    isContinuation:
      shortMessage &&
      looksLikeContinuation &&
      hasHistory,
  };
}