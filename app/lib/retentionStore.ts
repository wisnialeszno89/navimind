import { kv } from "@vercel/kv";

export type RetentionDay = 1 | 3 | 7 | 14 | 30;

type RetentionState = {
  email: string;
  sentDays: RetentionDay[];
};

function key(userId: string) {
  return `retention:${userId}`;
}

/* ================= GET ALL USERS ================= */

export async function getAllUsersWithEmail(): Promise<
  { userId: string; email: string }[]
> {
  const keys = await kv.keys("retention:*");

  const users: { userId: string; email: string }[] = [];

  for (const k of keys) {
    const userId = k.replace("retention:", "");
    const state = await kv.get<RetentionState>(k);

    if (state?.email) {
      users.push({ userId, email: state.email });
    }
  }

  return users;
}

/* ================= SHOULD SEND ================= */

export async function shouldSendRetention(
  userId: string
): Promise<RetentionDay | null> {
  const state = await kv.get<RetentionState>(key(userId));
  if (!state) return null;

  const days: RetentionDay[] = [1, 3, 7, 14, 30];

  for (const d of days) {
    if (!state.sentDays?.includes(d)) {
      return d;
    }
  }

  return null;
}

/* ================= MARK SENT ================= */

export async function markRetentionSent(
  userId: string,
  day: RetentionDay
) {
  const k = key(userId);
  const state = await kv.get<RetentionState>(k);

  if (!state) return;

  const next: RetentionState = {
    ...state,
    sentDays: [...(state.sentDays ?? []), day],
  };

  await kv.set(k, next);
}

/* ================= SAVE EMAIL ================= */

export async function saveRetentionEmail(userId: string, email: string) {
  const k = key(userId);

  const state: RetentionState = {
    email,
    sentDays: [],
  };

  await kv.set(k, state);
}
