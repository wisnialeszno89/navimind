export function extractEntities(text: string): string[] {
  const matches =
    text.match(
      /\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-Z0-9.-]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż0-9.-]+){0,3})\b/g
    ) || [];

  const blacklist = [
    "Tak",
    "No",
    "Można",
    "Poza",
    "Jasne",
    "Dobra",
  ];

  return [...new Set(
    matches.filter(
      (m) =>
        m.length > 2 &&
        !blacklist.includes(m)
    )
  )];
}

export function buildEntityContext(
  history: any[]
): string {
  const recent = history
    .slice(-16)
    .map((m) => m.content)
    .join(" ");

  const entities = extractEntities(recent);

  if (!entities.length) return "";

  return `
AKTYWNE BYTY ROZMOWY:
${entities.join(", ")}
`;
}