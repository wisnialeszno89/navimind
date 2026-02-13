import { kv } from "@vercel/kv";
import type { DayMemory } from "./dayMemory";

/**
 * Pobiera ostatnie N dni pamięci
 */
export async function getLastDays(
  userId: string,
  days = 7
): Promise<DayMemory[]> {
  const results: DayMemory[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const date = d.toISOString().slice(0, 10);
    const key = `navimind:day:${userId}:${date}`;

    const data = await kv.get<DayMemory>(key);
    if (data) results.push(data);
  }

  return results.reverse();
}

/**
 * Prosta analiza trendu emocji — BEZ AI (zero kosztów)
 */
export function analyzeEmotionTrend(days: DayMemory[]) {
  if (days.length < 3) return null;

  const negatives = ["stres", "lęk", "smutek", "złość", "przytłoczenie"];

  let negativeCount = 0;

  for (const d of days) {
    if (!d.emotion) continue;

    const isNegative = negatives.some((n) =>
      d.emotion!.toLowerCase().includes(n)
    );

    if (isNegative) negativeCount++;
  }

  const ratio = negativeCount / days.length;

  if (ratio >= 0.6) {
    return "W ostatnich dniach masz więcej napięcia niż zwykle.";
  }

  if (ratio <= 0.2) {
    return "Ostatnie dni wyglądają spokojniej niż wcześniej.";
  }

  return null;
}
