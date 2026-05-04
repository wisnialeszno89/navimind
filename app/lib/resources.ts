// app/lib/resources.ts

export function injectResources(userText: string): string | null {
  const t = userText.toLowerCase();

  // 🔥 Licheń / podróże
  if (/lichen|sanktuarium|co warto zobaczyc|gdzie jechac/.test(t)) {
    return `
Zobacz:
- https://www.lichen.pl
- https://maps.google.com/?q=Licheń+Stary

[IMAGE: sanktuarium lichen bazylika]
[IMAGE: lichen wieza widokowa panorama]
`;
  }

  // 🔥 zdrowie
  if (/badania|hormony|tarczyca/.test(t)) {
    return `
Sprawdź:
- https://diag.pl
- https://www.znanylekarz.pl
`;
  }

  // 🔥 prawo / dzieci
  if (/dzieci|sąd|kontakt/.test(t)) {
    return `
Pomoc:
- https://www.gov.pl/web/sprawiedliwosc
- https://www.rzecznikrodziny.pl
`;
  }

  return null;
}


// 🔥 pytania pomocnicze
export function addSmartQuestion(text: string, userText: string): string {
  const t = userText.toLowerCase();

  if (/lichen|wyjazd/.test(t)) {
    return text + "\n\nJedziesz bardziej na spokojne zwiedzanie czy chcesz też coś aktywnie ogarnąć w okolicy?";
  }

  if (/dzieci|sąd/.test(t)) {
    return text + "\n\nMasz teraz jakikolwiek kontakt z dziećmi czy całkowita blokada?";
  }

  return text;
}