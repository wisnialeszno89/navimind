import { kv } from "@vercel/kv";

export function scoreConversationStep(
  userText: string,
  aiText: string
) {
  let score = 0;

  const userLen = userText.length;
  const aiLen = aiText.length;
  const lower = userText.toLowerCase();

  if (userLen > 80) score += 3;
  else if (userLen > 40) score += 2;
  else if (userLen > 15) score += 1;
  else score -= 1;

  if (aiLen > 500) score -= 2;
  else if (aiLen > 250) score -= 1;
  else score += 1;

  if (/mam dość|wkurza|męczy|czemu|dlaczego/.test(lower)) {
    score += 2;
  }

  if (/^(ok|okej|no|haha|xd)$/i.test(userText.trim())) {
    score -= 3;
  }

  if (score >= 4) return { score, label: "high" };
  if (score >= 1) return { score, label: "medium" };

  return { score, label: "low" };
}

export async function saveScore(userId: string, score: any, plan?: string) {
  if (plan !== "pro" && plan !== "pro_plus") return;

  const key = `score:${userId}`;

  const existing = (await kv.get<any[]>(key)) || [];

  existing.push({
    ...score,
    timestamp: Date.now(),
  });

  const trimmed = existing.slice(-20);

  await kv.set(key, trimmed);
}