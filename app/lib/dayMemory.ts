import { kv } from "@vercel/kv";

export type DayMemory = {
  date: string; // YYYY-MM-DD
  highlight?: string;
  emotion?: string;
  summary: string;
  microStep: string;
  createdAt: number;
};

function key(userId: string, date: string) {
  return `navimind:day:${userId}:${date}`;
}

export async function saveDayMemory(userId: string, memory: DayMemory) {
  await kv.set(key(userId, memory.date), memory);
}

export async function getLastDayMemory(userId: string): Promise<DayMemory | null> {
  const today = new Date();
  const date = today.toISOString().slice(0, 10);

  const data = await kv.get<DayMemory>(key(userId, date));
  return data ?? null;
}
