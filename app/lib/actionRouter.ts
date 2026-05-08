export type ActionType =
  | "generate_pdf"
  | "none";

export function detectActionIntent(
  userText: string
): ActionType {
  const t = userText.toLowerCase();

  // 📄 PDF
  if (
    /pdf|w pdf|wygeneruj pdf|stwórz pdf|przygotuj pdf/.test(t)
  ) {
    return "generate_pdf";
  }

  return "none";
}