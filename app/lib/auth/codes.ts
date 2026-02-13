import { kv } from "@vercel/kv";

const TTL_MIN = Number(process.env.AUTH_CODE_TTL_MINUTES || "10");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateCode() {
  // 6 cyfr
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function saveCode(email: string, code: string) {
  const key = `auth_code:${normalizeEmail(email)}`;
  await kv.set(key, { code }, { ex: TTL_MIN * 60 });
}

export async function verifyCode(email: string, code: string) {
  const key = `auth_code:${normalizeEmail(email)}`;
  const data = await kv.get<{ code: string }>(key);

  if (!data?.code) return false;
  if (data.code !== code) return false;

  // jednokrotnego użytku
  await kv.del(key);
  return true;
}