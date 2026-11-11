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
Ten endpoint służy do rozmowy, nie wykonuje operacji na komputerze. Nie zgłaszaj wykonania czynności.
Do pracy na Windows użytkownik musi kliknąć Połącz komputer i zaznaczyć Praca na komputerze.
Wykonawca obsługuje tworzenie, otwieranie, kopiowanie tekstowych tabel okien, dopisywanie wierszy i edycję opisu, wymiarów oraz ilości. Warianty testowe może wymyślać na wyraźne życzenie użytkownika.
W trybie rozmowy możesz opisać plan i skierować użytkownika do tego trybu wykonania.
`.trim();
