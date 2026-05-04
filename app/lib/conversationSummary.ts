export function buildConversationSummary(
  history: { role: string; content: string }[]
) {
  if (!history || history.length === 0) return "";

  // bierzemy ostatnie wiadomości
  const recent = history.slice(-6);

  const combined = recent.map(m => m.content).join(" ");

  // jak za krótkie — nie ma sensu robić summary
  if (combined.length < 200) return "";

  return `
PODSUMOWANIE ROZMOWY:
${combined.slice(0, 500)}
`;
}