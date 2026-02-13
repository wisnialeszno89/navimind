import { kv } from "@vercel/kv";

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

export const FREE_HARD_LIMIT = 20; // ✅ 15 normal + 5 soft
export const FREE_SOFT_FROM = 15;  // ✅ po 15 zaczyna skracać

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
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  );
  return next.getTime();
}

/**
 * ✅ FREE DEMO limit resetowany o północy UTC
 */
export async function getCurrentLimit(
  userId: string,
  limit = FREE_HARD_LIMIT
): Promise<DemoLimitResult> {
  const day = getDayStampUTC();
  const key = `free_limit:${userId}:${day}`;

  const resetAt = nextUtcMidnightMs();

  const state = await kv.get<DemoState>(key);
  const used = state?.used ?? 0;

  return {
    allowed: used < limit,
    used,
    remaining: Math.max(0, limit - used),
    limit,
    resetAt,
  };
}

/**
 * ✅ inkrementacja FREE (wołaj w /api/chat dla FREE)
 */
export async function checkAndIncrementLimit(
  userId: string,
  limit = FREE_HARD_LIMIT
): Promise<DemoLimitResult> {
  const day = getDayStampUTC();
  const key = `free_limit:${userId}:${day}`;

  const now = Date.now();
  const resetAt = nextUtcMidnightMs();
  const ttlMs = Math.max(resetAt - now, 1000);

  const state = await kv.get<DemoState>(key);
  const usedNow = state?.used ?? 0;

  if (usedNow >= limit) {
    return {
      allowed: false,
      used: usedNow,
      remaining: 0,
      limit,
      resetAt,
    };
  }

  const used = usedNow + 1;

  await kv.set(key, { used }, { px: ttlMs });

  return {
    allowed: true,
    used,
    remaining: Math.max(0, limit - used),
    limit,
    resetAt,
  };
}
