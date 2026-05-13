export function buildSemanticMemory(
  history: any[]
) {
  const recent = history
    .slice(-12)
    .map((m) => m.content.toLowerCase())
    .join(" ");

  const memory: string[] = [];

  if (/mechanik|auto|samochód|dym/.test(recent)) {
    memory.push(
      "Rozmowa dotyczy problemu z autem lub mechanikiem."
    );
  }

  if (/ex|była|dzieci|sąd|ojciec/.test(recent)) {
    memory.push(
      "Rozmowa dotyczy relacji rodzinnych lub dzieci."
    );
  }

  if (/praca|szef|kierownik|zespół/.test(recent)) {
    memory.push(
      "Rozmowa dotyczy problemów w pracy."
    );
  }

  if (/tata|dziadek|choruje|ablacja|serce/.test(recent)) {
    memory.push(
      "Rozmowa dotyczy zdrowia bliskiej osoby."
    );
  }

  return memory.join("\n");
}