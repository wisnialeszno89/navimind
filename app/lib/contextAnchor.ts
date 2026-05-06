import { kv } from "@vercel/kv";
export function extractContextAnchor(
  history: { role: string; content: string }[]
) {
  const text = history.map(m => m.content).join(" ").toLowerCase();

  if (/żona|była|rozwód/.test(text) && /dziecko|syn/.test(text)) {
    return "Konflikt z byłą partnerką dotyczący dziecka i oskarżeń";
  }

  if (/prawo|sąd|pozew|policja/.test(text)) {
    return "Sytuacja prawna / konflikt prawny";
  }

  if (/kłamstwo|oskarża|stalking/.test(text)) {
    return "Fałszywe oskarżenia i konflikt interpersonalny";
  }

  return "";
}
export async function setRelationAnchor(userId: string, text: string) {
  const key = `user:anchor:${userId}`;
  await kv.set(key, text);
}

export async function getRelationAnchor(userId: string): Promise<string | null> {
  return await kv.get(`user:anchor:${userId}`);
}