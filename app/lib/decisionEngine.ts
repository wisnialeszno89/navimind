export type Decision = {
  type: "answer" | "guide" | "clarify" | "slow";
};

export function decideResponse(userText: string): Decision {
  const text = userText.toLowerCase();

  // 🔥 KONKRET = odpowiedź
  if (/(co zrobić|jak|konkretnie|powiedz wprost)/.test(text)) {
    return { type: "answer" };
  }

  // 🔥 CHAOS
  if (/(nie wiem|wszystko naraz|przytłacza|chaos)/.test(text)) {
    return { type: "slow" };
  }

  // 🔥 KRÓTKA WIADOMOŚĆ
  if (text.length < 50) {
    return { type: "clarify" };
  }

  // 🔥 RESZTA
  return { type: "guide" };
}