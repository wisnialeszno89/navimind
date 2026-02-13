import { kv } from "@vercel/kv";


function key(userId: string) {
return `navimind:lastActive:${userId}`;
}


export async function setLastActive(userId: string) {
await kv.set(key(userId), Date.now());
}


export async function getLastActive(userId: string): Promise<number | null> {
const v = await kv.get<number>(key(userId));
return v ?? null;
}