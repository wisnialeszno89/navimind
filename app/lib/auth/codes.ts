import { kv } from "@vercel/kv";

function normalize(email: string) {
  return email.trim().toLowerCase();
}

export async function saveCode(email: string, code: string) {
  const key = normalize(email);

  console.log("KV SAVE:", key, code);

  await kv.set(`login_code:${key}`, code, {
    ex: 60 * 10, // 10 minut
  });
}

export async function verifyCode(email: string, code: string) {
  const key = normalize(email);

  try {
    const storedRaw = await kv.get(`login_code:${key}`);

    const stored = String(storedRaw || "").trim();
    const input = String(code).trim();

    console.log("KV GET:", key, stored, input);

    if (!stored) return false;

    if (stored === input) {
      await kv.del(`login_code:${key}`); // usuń po użyciu
      return true;
    }

    return false;
  } catch (e) {
    console.error("VERIFY KV ERROR:", e);
    return false;
  }
}