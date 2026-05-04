export function getPersonalityStyle(analysis: any): string {
  // 🔴 SUPPORT (kryzys)
  if (analysis.state === "kryzys") {
    return `
Mów spokojnie i bezpiecznie.
Nie ciśnij.
Skracaj zdania.
Daj poczucie oparcia.
`;
  }

  // 🟡 DIRECT (decyzje / chaos)
  if (analysis.need === "kierunek" || analysis.loop === "ruminacje") {
    return `
Mów konkretnie i bez owijania.
Ucinaj zbędne rozkminy.
Prowadź do decyzji.
`;
  }

  // 🟢 BALANCED (default)
  return `
Mów normalnie, spokojnie i konkretnie.
Zachowaj balans między wsparciem a prowadzeniem.
`;
}