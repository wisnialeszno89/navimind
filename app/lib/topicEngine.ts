export function detectTopic(text: string): string | null {
  const t = text.toLowerCase();

  if (/ludzie|toksyczni|wkurwiają/.test(t)) return "ludzie";
  if (/praca|firma|szef/.test(t)) return "praca";
  if (/związek|dziewczyna|żona|rozstanie/.test(t)) return "relacja";
  if (/sens życia|po co żyć/.test(t)) return "sens";

  return null;
}