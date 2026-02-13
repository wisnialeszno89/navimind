import { kv } from "@vercel/kv";

export type UsageType = "pdf" | "image" | "upload";

export type UsageResult = {
  allowed: boolean;
  used: number;
  remaining: number;
  resetAt: number;
  limit: number;
};

function monthStampUTC() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthResetAtUTC() {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0)
  );
  return next.getTime();
}

function secondsToNextMonthUTC() {
  const resetAt = monthResetAtUTC();
  const diffMs = resetAt - Date.now();
  return Math.max(60, Math.floor(diffMs / 1000)); // min 60s
}

function monthKey(userId: string, type: UsageType) {
  // usage:{userId}:{type}:{YYYY-MM}
  return `usage:${userId}:${type}:${monthStampUTC()}`;
}

/* =========================================================
   ✅ READ-ONLY: pobierz stan użycia (bez increment)
   ========================================================= */
export async function getMonthlyUsageState(
  userId: string,
  type: UsageType,
  limit: number
): Promise<UsageResult> {
  const key = monthKey(userId, type);
  const used = (await kv.get<number>(key)) ?? 0;

  return {
    allowed: used < limit,
    used,
    remaining: Math.max(0, limit - used),
    resetAt: monthResetAtUTC(),
    limit,
  };
}

/* =========================================================
   ✅ ATOMIC: sprawdź + nabij użycie miesięczne
   - kv.incr jest atomiczne
   - jeśli przekroczono limit → cofamy kv.decr
   ========================================================= */
export async function checkAndIncrementMonthlyUsage(
  userId: string,
  type: UsageType,
  limit: number
): Promise<UsageResult> {
  const key = monthKey(userId, type);

  // atomic increment
  const used = await kv.incr(key);

  // TTL żeby klucze same znikały co miesiąc
  // (Vercel KV wspiera expire)
  await kv.expire(key, secondsToNextMonthUTC());

  // jeśli limit przekroczony → cofamy
  if (used > limit) {
    await kv.decr(key);

    const usedNow = (await kv.get<number>(key)) ?? limit;

    return {
      allowed: false,
      used: usedNow,
      remaining: 0,
      resetAt: monthResetAtUTC(),
      limit,
    };
  }

  return {
    allowed: true,
    used,
    remaining: Math.max(0, limit - used),
    resetAt: monthResetAtUTC(),
    limit,
  };
}