export function normalizeFollowup(
  userText: string,
  history: any[]
): string {
  const t = userText.trim();

  if (t.length > 60) {
    return userText;
  }

  const lastAssistant =
    history
      .filter((m) => m.role === "assistant")
      .slice(-1)[0]?.content || "";

  return `
To kontynuacja poprzedniej rozmowy.

Poprzednia odpowiedź:
"${lastAssistant}"

Nowa wiadomość:
"${userText}"
`;
}