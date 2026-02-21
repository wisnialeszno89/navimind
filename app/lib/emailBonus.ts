import { kv } from "@vercel/kv";

const BONUS_MESSAGES = 10;

function key(userId: string) {
  return `email_bonus:${userId}`;
}

export async function hasUsedEmailBonus(userId: string) {
  const v = await kv.get<boolean>(key(userId));
  return v === true;
}

export async function grantEmailBonus(userId: string) {
  await kv.set(key(userId), true);
  return BONUS_MESSAGES;
}
