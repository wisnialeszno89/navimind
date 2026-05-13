export function detectContinuation(
  text: string
): boolean {
  const t =
    text.toLowerCase().trim();

  const exactMatches = [
    "dawaj",
    "okej",
    "ok",
    "tak",
    "no",
    "dalej",
    "kontynuuj",
    "jakies linki",
    "jakis link",
    "link",
    "kontakt",
    "telefon",
    "strona",
    "pokaz",
    "pokaż",
  ];

  if (
    exactMatches.includes(t)
  ) {
    return true;
  }

  if (
    t.includes("link") ||
    t.includes("kontakt") ||
    t.includes("telefon") ||
    t.includes("strona")
  ) {
    return true;
  }

  return false;
}