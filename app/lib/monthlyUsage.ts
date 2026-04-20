import { kv } from "@vercel/kv";

/* =========================================================
   🎯 TYPY — PROSTE I SPÓJNE
   ========================================================= */

export type UsageType =
  "file" | "file_daily" | "edit"| "auto_mask";

export type UsageResult = {
  allowed: boolean;
  used: number;
  remaining: number;
  resetAt: number;
  limit: number;
};

/* =========================================================
   📅 CZAS
   ========================================================= */

function monthStampUTC() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthResetAtUTC() {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return next.getTime();
}

function secondsToNextMonthUTC() {
  const resetAt = monthResetAtUTC();
  const diffMs = resetAt - Date.now();
  return Math.max(60, Math.floor(diffMs / 1000));
}

function monthKey(userId: string, type: UsageType) {
  return `usage:${userId}:${type}:${monthStampUTC()}`;
}

/* =========================================================
   📊 READ ONLY
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
   🚀 ATOMIC CHECK + INCREMENT
   ========================================================= */

export async function checkAndIncrementMonthlyUsage(
  userId: string,
  type: UsageType,
  limit: number
): Promise<UsageResult> {
  const key = monthKey(userId, type);

  const used = await kv.incr(key);

  // 🔥 ustaw TTL tylko jeśli nowy klucz
  if (used === 1) {
    await kv.expire(key, secondsToNextMonthUTC());
  }

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