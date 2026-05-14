export function detectAffirmative(
  text: string
): boolean {
  const t =
    text.toLowerCase().trim();

  return [
    "tak",
    "tak poprosze",
    "jasne",
    "dawaj",
    "okej",
    "ok",
    "poprosze",
    "proszę",
    "pewnie",
    "spoko",
    "luz",
    
    "no",
    "nom",
    "yh",
    "y",
    "ta",
  ].includes(t);
}