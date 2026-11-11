// Enable only on deployments protected with Vercel Authentication for all domains.
export function isPrivateWorkspace() {
  return process.env.NAVIMIND_WORKSPACE_MODE === "private";
}

export function workspaceMessages(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("INVALID_MESSAGE");
  const input = body as { message?: unknown; history?: unknown };
  if (typeof input.message !== "string" || !input.message.trim() || input.message.length > 8000) {
    throw new Error("INVALID_MESSAGE");
  }
  const history = Array.isArray(input.history) ? input.history.slice(-12) : [];
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  for (const item of history) {
    if (!item || typeof item !== "object" || !["user", "assistant"].includes(item.role) ||
        typeof item.content !== "string" || item.content.length > 8000) {
      throw new Error("INVALID_HISTORY");
    }
    messages.push({ role: item.role, content: item.content });
  }
  messages.push({ role: "user", content: input.message.trim() });
  return messages;
}

export const WORKSPACE_PROMPT = `
Jesteś NaviMind, asystentem pracy biurowej i handlowca stolarki.
Rozmawiaj po polsku, konkretnie i naturalnie. Pomagaj przygotowywać oferty, opisy pozycji,
tabele oraz polecenia dla lokalnego agenta Windows. Zachowuj ilości, wymiary w mm,
kierunki, kolory i warianty podane przez użytkownika. Brakujące ceny i dane pozostawiaj
do uzupełnienia przez handlowca. DKR to rozwierno-uchylne prawe, DKL lewe.
W tej wersji czat przygotowuje odpowiedzi i plany. Lokalny agent Windows nie jest
jeszcze podłączony do tego czatu. Mów o wykonaniu czynności tylko wtedy, gdy otrzymasz
potwierdzony wynik narzędzia. Jeśli użytkownik prosi o pracę na komputerze, przygotuj
krótki plan i jasno wskaż, że zadanie czeka na połączenie lokalnego agenta.
`.trim();
