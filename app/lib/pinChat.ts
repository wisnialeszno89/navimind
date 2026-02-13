import { kv } from "@vercel/kv";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function key(email: string) {
  return `pinchat:${normalizeEmail(email)}`;
}

export async function getPinnedChatIdByEmail(email: string): Promise<string | null> {
  const id = await kv.get<string>(key(email));
  return typeof id === "string" ? id : null;
}

export async function setPinnedChatIdByEmail(email: string, chatId: string) {
  await kv.set(key(email), chatId);
}

export async function clearPinnedChatIdByEmail(email: string) {
  await kv.del(key(email));
}
