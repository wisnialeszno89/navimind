export type ResponseType =
  | "strategy"
  | "decision"
  | "support"
  | "reflection"
  | "direct";

export function detectResponseType(
  userText: string,
  analysis: any
): ResponseType {
  const t = userText.toLowerCase();

  // 🔥 biznes / rozwój / projekty
  if (
    /projekt|biznes|strona|aplikacja|ruch|sprzedać|sprzedac|seo|marketing/.test(t)
  ) {
    return "strategy";
  }

  // 🔥 decyzje życiowe
  if (
    /nie wiem czy|wybrać|co zrobić|co robic|decydować|decyzj/.test(t)
  ) {
    return "decision";
  }

  // 🔥 ciężki stan
  if (
    analysis?.state === "emotional" ||
    /mam dość|nie mam siły|wszystko mnie męczy/.test(t)
  ) {
    return "support";
  }

  // 🔥 refleksja
  if (/dlaczego|czemu|po co/.test(t)) {
    return "reflection";
  }

  return "direct";
}