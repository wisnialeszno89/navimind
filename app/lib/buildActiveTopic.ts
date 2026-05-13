export function buildActiveTopic(
  history: any[]
) {
  const joined = history
    .slice(-10)
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (
    /balaton|węgry|camping|pole namiotowe|kamper/.test(
      joined
    )
  ) {
    return `
AKTYWNY TEMAT:
Rozmowa dotyczy wyjazdu nad Balaton.

Użytkownik:
- szuka miejsca na rodzinny wyjazd,
- jedzie z dziećmi i psem,
- chce natury i spokoju,
- ale blisko infrastruktury i miasta,
- interesują go linki, miejsca i rekomendacje.
`;
  }

  if (
    /mechanik|auto|dym|silnik/.test(joined)
  ) {
    return `
AKTYWNY TEMAT:
Rozmowa dotyczy problemu z autem.

Użytkownik prawdopodobnie:
- szuka mechanika,
- kontaktu,
- warsztatu,
- pomocy technicznej.
`;
  }

  if (
    /ex|dzieci|sąd|opieka/.test(joined)
  ) {
    return `
AKTYWNY TEMAT:
Rozmowa dotyczy konfliktu rodzinnego i dzieci.
`;
  }

  return "";
}