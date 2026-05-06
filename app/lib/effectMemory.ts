import { kv } from "@vercel/kv";

function key(userId: string) {
  return `navimind:effects:${userId}`;
}

type EffectEntry = {
  type: string;
  ts: number;
};

export async function getRecentEffects(userId: string): Promise<EffectEntry[]> {
  const data = await kv.get<EffectEntry[]>(key(userId));
  return data || [];
}

export async function saveEffect(userId: string, effect: string) {
  const current = (await getRecentEffects(userId)) || [];

  const updated: EffectEntry[] = [
    ...current,
    { type: effect, ts: Date.now() },
  ].slice(-5); // 🔥 pamiętamy 5 ostatnich

  await kv.set(key(userId), updated);
}