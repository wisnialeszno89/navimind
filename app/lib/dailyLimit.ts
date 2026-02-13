import { kv } from "@vercel/kv";

type DailyState = {
  used: number;
};

export type DailyLimitResult = {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  resetAt: number;
};

function getDayKeyPart(now = new Date()) {
  // YYYY-MM-DD
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextUtcMidnightMs() {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  return next.getTime();
}

/**
 * Limit dzienny resetowany o północy UTC.
 * (Prosty i przewidywalny)
 */
export async function checkAndIncrementDailyLimit(
  userId: string,
  limit: number
): Promise<DailyLimitResult> {
  const day = getDayKeyPart();
  const key = `daily_limit:${userId}:${day}`;

  const now = Date.now();
  const resetAt = nextUtcMidnightMs();
  const ttlMs = Math.max(resetAt - now, 1000);

  const state = await kv.get<DailyState>(key);

  // pierwszy raz dzisiaj
  if (!state) {
    const used = 1;
    await kv.set(key, { used }, { px: ttlMs });

    return {
      allowed: true,
      used,
      remaining: Math.max(limit - used, 0),
      limit,
      resetAt,
    };
  }

  // limit osiągnięty
  if (state.used >= limit) {
    return {
      allowed: false,
      used: state.used,
      remaining: 0,
      limit,
      resetAt,
    };
  }

  // inkrementacja
  const used = state.used + 1;
  await kv.set(key, { used }, { px: ttlMs });

  return {
    allowed: true,
    used,
    remaining: Math.max(limit - used, 0),
    limit,
    resetAt,
  };
}

export async function getCurrentDailyLimit(
  userId: string,
  limit: number
): Promise<DailyLimitResult> {
  const day = getDayKeyPart();
  const key = `daily_limit:${userId}:${day}`;

  const now = Date.now();
  const resetAt = nextUtcMidnightMs();

  const state = await kv.get<DailyState>(key);

  const used = state?.used ?? 0;

  return {
    allowed: used < limit,
    used,
    remaining: Math.max(limit - used, 0),
    limit,
    resetAt,
  };
}