export function extractQuestion(text: string) {
  if (!text) {
    return { rest: "", question: null };
  }

  // Szukamy ostatniego znaku zapytania
  const lastQuestionMark = text.lastIndexOf("?");

  if (lastQuestionMark === -1) {
    return { rest: text, question: null };
  }

  // Cofamy się do początku zdania
  const before = text.slice(0, lastQuestionMark + 1);
  const after = text.slice(lastQuestionMark + 1).trim();

  // Wyciągamy ostatnie zdanie jako pytanie
  const sentences = before.split(/(?<=[.!?])\s+/);
  const question = sentences.pop()?.trim() ?? null;

  const rest = sentences.join(" ").trim();

  return {
    rest,
    question,
  };
}