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