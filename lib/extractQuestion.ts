export function extractQuestion(text: string): {
  rest: string;
  question: string | null;
} {
  if (!text || typeof text !== "string") {
    return {
      rest: "",
      question: null,
    };
  }

  /**
   * Szukamy pytania TYLKO jeśli:
   * - jest na końcu
   * - faktycznie kończy się znakiem zapytania
   * - jest oddzielone pustą linią (świadome pytanie)
   *
   * Przykład:
   * "To jest odpowiedź.\n\nCo chcesz zrobić dalej?"
   */
  const match = text.match(/([\s\S]*?)\n\n(.+?\?)\s*$/);

  if (!match) {
    return {
      rest: text.trim(),
      question: null,
    };
  }

  return {
    rest: match[1].trim(),
    question: match[2].trim(),
  };
}