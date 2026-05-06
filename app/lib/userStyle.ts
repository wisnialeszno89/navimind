export function detectUserStyle(text: string): string {
  const t = text.toLowerCase();

  if (t.length < 40) return "direct";

  if (/kurwa|jebane|pojebane|xd|haha/.test(t)) {
    return "chaotic";
  }

  if (/czuję|mam wrażenie|męczy|przytłacza/.test(t)) {
    return "emotional";
  }

  if (/dlaczego|czemu|zastanawiam/.test(t)) {
    return "reflective";
  }

  return "direct";
}