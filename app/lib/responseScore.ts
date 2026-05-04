export function scoreResponse(text: string) {
  let score = 0;

  const t = text.toLowerCase();

  // + konkret
  if (t.length < 200) score += 2;

  // + brak ogólników
  if (!/to normalne|warto|proces/.test(t)) score += 2;

  // + nie jest pytaniem
  if (!t.includes("?")) score += 1;

  // + zawiera konkret (np. napięcie, wraca, ciągnie)
  if (/napięcie|wraca|ciągnie|odpala/.test(t)) score += 2;

  // - ogólnik
  if (/spróbuj|możesz|warto/.test(t)) score -= 2;

  return score;
}