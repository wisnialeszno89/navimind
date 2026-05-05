export function getPersonalityStyle(
  analysis: any,
  userText: string
): string {

  // 🔍 wykrycie stylu usera
  const t = userText.toLowerCase();

  let userStyle = "neutral";

  if (t.length < 15) userStyle = "short";
  else if (/kurwa|ja pierdole|wkurwia/.test(t)) userStyle = "direct";
  else if (/czemu|dlaczego/.test(t)) userStyle = "analytical";
  else if (/czuję|mam wrażenie|boję/.test(t)) userStyle = "emotional";

  // 🔴 SUPPORT (kryzys)
  if (analysis.state === "kryzys") {
    return `
Mów spokojnie i bezpiecznie.
Skracaj zdania.
Daj poczucie oparcia.
Dostosuj styl do usera (${userStyle}).
`;
  }

  // 🟡 DIRECT (decyzje / chaos)
  if (analysis.need === "kierunek" || analysis.loop === "ruminacje") {
    return `
Mów konkretnie i bez owijania.
Ucinaj zbędne rozkminy.
Prowadź do decyzji.
Dostosuj styl do usera (${userStyle}).
`;
  }

  // 🟢 BALANCED
  return `
Mów normalnie i naturalnie.
Nie analizuj na siłę.

Dostosuj się do stylu usera (${userStyle}):

- short → krótko
- direct → bez miękkich wstępów
- emotional → więcej wyczucia
- analytical → trochę więcej sensu i logiki
`;
}
export function detectUserStyle(text: string): string {
  const t = text.toLowerCase();

  if (t.length < 15) return "short";
  if (/kurwa|ja pierdole|wkurwia/.test(t)) return "direct";
  if (/czemu|dlaczego/.test(t)) return "analytical";
  if (/czuję|mam wrażenie|boję/.test(t)) return "emotional";

  return "neutral";
}