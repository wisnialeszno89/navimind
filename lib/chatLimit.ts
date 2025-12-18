import { kv } from "@vercel/kv";

const DAILY_LIMIT = 20;
const WINDOW_MS = 24 * 60 * 60 * 1000;

type LimitState = {
  used: number;
  resetAt: number;
};

export async function checkAndIncrementLimit(userId: string) {
  const key = `chat_limit:${userId}`;
  const now = Date.now();

  let state = await kv.get<LimitState>(key);

  // pierwszy raz albo reset
  if (!state || now > state.resetAt) {
    const newState: LimitState = {
      used: 1,
      resetAt: now + WINDOW_MS,
    };

    await kv.set(key, newState, {
      px: WINDOW_MS,
    });

    return {
      allowed: true,
      used: 1,
      limit: DAILY_LIMIT,
      resetAt: newState.resetAt,
    };
  }

  // limit przekroczony
  if (state.used >= DAILY_LIMIT) {
    return {
      allowed: false,
      used: state.used,
      limit: DAILY_LIMIT,
      resetAt: state.resetAt,
    };
  }

  // inkrementacja
  const updated: LimitState = {
    ...state,
    used: state.used + 1,
  };

  await kv.set(key, updated, {
    px: state.resetAt - now,
  });

  return {
    allowed: true,
    used: updated.used,
    limit: DAILY_LIMIT,
    resetAt: updated.resetAt,
  };
}