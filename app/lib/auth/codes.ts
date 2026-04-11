console.log("VERIFY ENV KV URL:", process.env.KV_REST_API_URL);
import { kv } from "@vercel/kv";

  const memoryStore = new Map<string, string>();

  function normalize(email: string) {
  return email.trim().toLowerCase();
 }

  export async function saveCode(email: string, code: string) {
  const key = normalize(email);

  console.log("KV SAVE:", key, code);

  try {
    await kv.set(`login_code:${key}`, code, {
      ex: 60 * 10,
    });
  } catch {
    console.warn("KV unavailable (local dev)");
    memoryStore.set(key, code);
  }
 }


export async function verifyCode(email: string, code: string) {
  const key = normalize(email);

  try {
    const stored = await kv.get<string>(`login_code:${key}`);

    if (stored) {
      if (stored !== code) return false;
      await kv.del(`login_code:${key}`);
      return true;
    }
  } catch {
    console.warn("KV unavailable (verify)");
  }

  // fallback LOCAL
  const local = memoryStore.get(key);

  if (!local) return false;
  if (local !== code) return false;

 // usuń await kv.del(...)
  return true;
}