import { kv } from "@vercel/kv";
import { hasUsedEmailBonus } from "./emailBonus";

type DemoState = {
  used: number;
};

export type DemoLimitResult = {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  resetAt: number;
};

export const FREE_HARD_LIMIT = 20; // 15 normal + 5 soft
export const FREE_SOFT_FROM = 15;

// YYYY-MM-DD (UTC)
function getDayStampUTC(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextUtcMidnightMs() {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return next.getTime();
}

/**
 * Aktualny stan limitu FREE
 */
export async function getCurrentLimit(
  userId: string,
  baseLimit = FREE_HARD_LIMIT
): Promise<DemoLimitResult> {
  const day = getDayStampUTC();
  const key = `free_limit:${userId}:${day}`;
  const resetAt = nextUtcMidnightMs();

  const state = await kv.get<DemoState>(key);
  const used = state?.used ?? 0;

  // 🎁 bonus +10 po podaniu maila
  const hasBonus = await hasUsedEmailBonus(userId);
  const finalLimit = hasBonus ? baseLimit + 10 : baseLimit;

  return {
    allowed: used < finalLimit,
    used,
    remaining: Math.max(0, finalLimit - used),
    limit: finalLimit,
    resetAt,
  };
}

/**
 * Inkrementacja FREE
 */
export async function checkAndIncrementLimit(
  userId: string,
  baseLimit = FREE_HARD_LIMIT
): Promise<DemoLimitResult> {
  const day = getDayStampUTC();
  const key = `free_limit:${userId}:${day}`;

  const now = Date.now();
  const resetAt = nextUtcMidnightMs();
  const ttlMs = Math.max(resetAt - now, 1000);

  const state = await kv.get<DemoState>(key);
  const usedNow = state?.used ?? 0;

  // 🎁 sprawdzamy bonus
  const hasBonus = await hasUsedEmailBonus(userId);
  const finalLimit = hasBonus ? baseLimit + 10 : baseLimit;

  if (usedNow >= finalLimit) {
    return {
      allowed: false,
      used: usedNow,
      remaining: 0,
      limit: finalLimit,
      resetAt,
    };
  }

  const used = usedNow + 1;

  await kv.set(key, { used }, { px: ttlMs });

  return {
    allowed: true,
    used,
    remaining: Math.max(0, finalLimit - used),
    limit: finalLimit,
    resetAt,
  };
}
