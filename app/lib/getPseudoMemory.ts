import { kv } from "@vercel/kv";
import { PseudoMemory } from "./pseudoMemory";

export async function getPseudoMemory(userId: string) {
  const data = await kv.get<PseudoMemory>(`memory:${userId}`);

  if (!data) return null;

  return {
    ...data,
    style: data.style ?? {
      short: 0,
      long: 0,
      chaotic: 0,
      direct: 0,
    },
  };
}