export function detectLocalIntent(text: string) {
  const t = text.toLowerCase();

  return /mechanik|warsztat|restauracja|hotel|klimatyzacja|fryzjer|gdzie zjeść|nocleg|firma|serwis/.test(
    t
  );
}