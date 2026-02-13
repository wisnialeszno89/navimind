import { kv } from "@vercel/kv";
import { PseudoMemory } from "./pseudoMemory";

export async function getPseudoMemory(userId: string) {
  return await kv.get<PseudoMemory>(`memory:${userId}`);
}