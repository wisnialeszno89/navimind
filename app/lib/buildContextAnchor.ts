export function buildContextAnchor(history: any[]) {
  const recent = history
    .slice(-8)
    .map((m) => m.content.toLowerCase())
    .join(" ");

  // RELACJE / LUDZIE
  if (
    /ludzie|tłum|system|materializm|wywyższanie|brak empatii|kontrola/.test(recent)
  ) {
    return `
Aktualny temat rozmowy:
mechanizmy społeczne, zachowania ludzi, wpływ tłumu i autentyczność.
`;
  }

  // ZWIĄZKI
  if (
    /związek|partner|żona|rozstanie/.test(recent)
  ) {
    return `
Aktualny temat rozmowy:
relacje i emocje między partnerami.
`;
  }

  // ŻYCIE / SENS
  if (
    /sens życia|po co żyć|świadomość|duchowość/.test(recent)
  ) {
    return `
Aktualny temat rozmowy:
sens życia, świadomość i sposób patrzenia na świat.
`;
  }

  return "";
}