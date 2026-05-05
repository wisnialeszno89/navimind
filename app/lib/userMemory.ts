import { kv } from "@vercel/kv";
type Memory = {
  mainIssue?: string;
  emotionalState?: string;
  lastUpdated?: number;
};

const memoryStore = new Map<string, Memory>();

export function updateMemory(userId: string, text: string) {
  const lower = text.toLowerCase();

  const memory = memoryStore.get(userId) || {};

  // 🔥 temat
  if (/dzieci|kontakt z dziecmi/.test(lower)) {
    memory.mainIssue = "dzieci";
  }

  if (/zona|rozstanie|odeszla/.test(lower)) {
    memory.mainIssue = "rozpad";
  }

  // 🔥 stan
  if (/nie dam rady|rozsypany|wykończony|depresja/.test(lower)) {
    memory.emotionalState = "kryzys";
  } else if (/ciezko|nie radze/.test(lower)) {
    memory.emotionalState = "przeciążenie";
  }

  memory.lastUpdated = Date.now();

  memoryStore.set(userId, memory);
}

export function getMemory(userId: string): Memory {
  return memoryStore.get(userId) || {};
}
type CoreMemory = {
  mainTopic?: string;
  lastTopics?: string[];
  contextAnchor?: string; // 🔥 NOWE
};

const store = new Map<string, CoreMemory>();

export function updateCoreMemory(userId: string, topic: string) {
  if (!topic) return;

  const current = store.get(userId) || {};

  store.set(userId, {
    mainTopic: topic,
    lastTopics: [
      ...(current.lastTopics || []).slice(-3),
      topic,
    ],
  });
}
export function updateContextAnchor(userId: string, anchor: string) {
  if (!anchor) return;

  const current = store.get(userId) || {};

  store.set(userId, {
    ...current,
    contextAnchor: anchor,
  });
}
export function getContextAnchor(userId: string): string | undefined {
  return store.get(userId)?.contextAnchor;
}

export function getCoreMemory(userId: string): CoreMemory {
  return store.get(userId) || {};
}
// 🔹 zapis mikro detalu
export async function saveMicroDetail(userId: string, text: string) {
  try {
    // tylko sensowne długości
    if (!text || text.length < 20 || text.length > 200) return;

    const key = `micro:${userId}`;

    // pobierz istniejące
    const existing = (await kv.get<string[]>(key)) || [];

    // dodaj nowe na początek
    const updated = [text, ...existing].slice(0, 5); // max 5 rzeczy

    await kv.set(key, updated);
  } catch (e) {
    console.error("saveMicroDetail error", e);
  }
}

// 🔹 pobierz losowy detal
export async function getMicroDetail(userId: string): Promise<string | null> {
  try {
    const key = `micro:${userId}`;
    const items = await kv.get<string[]>(key);

    if (!items || items.length === 0) return null;

    return items[Math.floor(Math.random() * items.length)];
  } catch {
    return null;
  }
}
export async function saveUserStyle(userId: string, style: string) {
  const key = `user:style:${userId}`;

  const current = await kv.get<{ style: string; count: number }>(key);

  if (!current) {
    await kv.set(key, { style, count: 1 });
    return;
  }

  // 🔥 prosta ewolucja (większość wygrywa)
  const newCount = current.style === style
    ? current.count + 1
    : current.count - 1;

  const finalStyle = newCount <= 0 ? style : current.style;

  await kv.set(key, {
    style: finalStyle,
    count: Math.max(newCount, 1),
  });
}

export async function getUserStyle(userId: string): Promise<string> {
  const data = await kv.get<{ style: string }>(`user:style:${userId}`);
  return data?.style || "neutral";
}
export async function saveTopic(userId: string, topic: string) {
  const key = `user:topic:${userId}`;

  const existing = await kv.get<string[]>(key);

  const updated = existing
    ? [topic, ...existing.filter(t => t !== topic)].slice(0, 5)
    : [topic];

  await kv.set(key, updated);
}

export async function getTopics(userId: string): Promise<string[]> {
  return (await kv.get<string[]>(`user:topic:${userId}`)) || [];
}
export async function savePattern(userId: string, pattern: string) {
  const key = `user:patterns:${userId}`;

  const existing = await kv.get<string[]>(key);

  const updated = existing
    ? [pattern, ...existing.filter(p => p !== pattern)].slice(0, 5)
    : [pattern];

  await kv.set(key, updated);
}

export async function getPatterns(userId: string): Promise<string[]> {
  return (await kv.get<string[]>(`user:patterns:${userId}`)) || [];
}
export async function saveAction(userId: string, action: string) {
  const key = `user:actions:${userId}`;

  const existing = await kv.get<string[]>(key);

  const updated = existing
    ? [action, ...existing].slice(0, 5)
    : [action];

  await kv.set(key, updated);
}

export async function getActions(userId: string): Promise<string[]> {
  return (await kv.get<string[]>(`user:actions:${userId}`)) || [];
}