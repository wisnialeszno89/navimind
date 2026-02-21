import { kv } from "@vercel/kv";

export type UserEmail = {
  email: string;
  createdAt: number;
  lastSeenAt: number;
};

function key(userId: string) {
  return `user_email:${userId}`;
}

/**
 * Zapis maila (pierwszy raz lub update lastSeenAt)
 */
export async function saveUserEmail(userId: string, email: string) {
  const now = Date.now();

  const existing = await kv.get<UserEmail>(key(userId));

  if (existing) {
    await kv.set(key(userId), {
      ...existing,
      lastSeenAt: now,
    });
    return;
  }

  await kv.set(key(userId), {
    email,
    createdAt: now,
    lastSeenAt: now,
  });
}

/**
 * Pobranie maila użytkownika
 */
export async function getUserEmail(userId: string) {
  return kv.get<UserEmail>(key(userId));
}
