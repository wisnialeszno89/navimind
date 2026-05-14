export function getFollowUp(userMemory: any, analysis: any): string | null {
  if (!userMemory?.lastDecision) return null;

  // jeśli user dalej w tym samym temacie
  if (analysis.intent === userMemory.intent) {
    return `Ostatnio wybrałeś: ${userMemory.lastDecision}. Idziemy dalej czy zmieniasz kierunek?`;
  }

  return null;
}