export function extractQuestion(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].endsWith("?")) {
      return {
        question: lines[i],
        rest: lines.slice(0, i).join("\n"),
      };
    }
  }

  return {
    question: null,
    rest: text,
  };
}