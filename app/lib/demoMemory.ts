import { kv } from "@vercel/kv";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

type DemoMemory = {
  messages: Msg[];
  updatedAt: number;
};

const MAX_MSG = 12;
const MAX_LEN = 600;

function dayStampUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function key(userId: string) {
  return `demo_memory:${userId}:${dayStampUTC()}`;
}

function sanitize(messages: Msg[]): Msg[] {
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({
      role: m.role,
      content: String(m.content || "").slice(0, MAX_LEN),
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_MSG);
}

export async function getDemoMemory(userId: string): Promise<Msg[]> {
  const data = await kv.get<DemoMemory>(key(userId));
  return sanitize(data?.messages ?? []);
}

export async function pushDemoMemory(userId: string, msg: Msg) {
  const k = key(userId);

  const current = await kv.get<DemoMemory>(k);

  const next: DemoMemory = {
    messages: sanitize([...(current?.messages ?? []), msg]),
    updatedAt: Date.now(),
  };

  // TTL do północy UTC
  const now = Date.now();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);

  const ttl = Math.max(midnight.getTime() - now, 1000);

  await kv.set(k, next, { px: ttl });
}
