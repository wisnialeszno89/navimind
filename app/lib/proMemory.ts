import { kv } from "@vercel/kv";

/* =========================
   TYPES
   ========================= */

export type ProMemory = {
  state?: string;
  mainProblem?: string;
  direction?: string;

  /** historia poziomów kryzysu do analizy trendu */
  emotionalLevels?: ("none" | "low" | "medium" | "high")[];

  lastSeenAt?: number;
  visits?: number;

  updatedAt: number;
};

/* =========================
   KEY
   ========================= */

function key(userId: string) {
  return `navimind:proMemory:${userId}`;
}

/* =========================
   GET
   ========================= */

export async function getProMemory(userId: string): Promise<ProMemory | null> {
  try {
    const data = await kv.get<ProMemory>(key(userId));
    return data ?? null;
  } catch {
    return null;
  }
}

/* =========================
   SAVE / UPSERT
   ========================= */

export async function saveProMemory(
  userId: string,
  memory: ProMemory
): Promise<void> {
  try {
    await kv.set(key(userId), memory);
  } catch {
    // cisza — pamięć nie może wywalić czata
  }
}
