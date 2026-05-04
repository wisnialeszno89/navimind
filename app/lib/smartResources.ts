export function buildResourcePrompt(userText: string) {
  const intent = detectResourceIntent(userText);

  return `
User pyta:
"${userText}"

Twoim zadaniem:
- podać konkretne zasoby

Zasady:
- max 3 rzeczy
- tylko konkret (link, miejsce, narzędzie)
- bez gadania
- bez wstępu

Jeśli lokalne:
- podaj nazwę + link do Google Maps

Jeśli how-to:
- podaj tutorial (YouTube lub artykuł)

Jeśli produkt:
- podaj konkretny model lub sklep

Format:
- punkt lista

Zero opisu.
`;
}
export function buildOptionsPrompt(userText: string, profile?: any) {
  const style = profile?.decisionStyle || "normal";

  let styleInstruction = "";

  if (style === "fast") {
    styleInstruction = `
- opcje krótkie
- konkret
- zero tłumaczenia
`;
  }

  if (style === "analytical") {
    styleInstruction = `
- opcje z krótkim uzasadnieniem
- pokaz różnice
`;
  }

  if (style === "emotional") {
    styleInstruction = `
- opcje spokojne
- bez presji
- bardziej miękkie sformułowania
`;
  }

  if (style === "avoidant") {
    styleInstruction = `
- opcje lekkie
- małe kroki
- bez presji decyzji
`;
  }

  return `
Użytkownik napisał:
"${userText}"

Twoim zadaniem:
- podać 3 konkretne opcje działania

Zasady:
- każda opcja w osobnej linii
- format:
1. ...
2. ...
3. ...

${styleInstruction}

Nie tłumacz.
Nie pisz wstępu.
Tylko opcje.
`;
}
export function detectResourceIntent(text: string) {
  const t = text.toLowerCase();

  if (/gdzie|blisko|w okolicy|najlepszy/.test(t)) return "local";
  if (/jak zrobić|naprawić|tutorial|krok po kroku/.test(t)) return "howto";
  if (/kupić|sprzęt|produkt/.test(t)) return "product";

  return "general";
}