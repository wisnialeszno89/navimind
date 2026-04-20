const store: Record<
  string,
  { image: string; createdAt: number }
> = {};

export function saveShare(id: string, base64: string) {
  store[id] = {
    image: base64,
    createdAt: Date.now(),
  };
}

export function getShare(id: string) {
  return store[id];
}

export function getAllShares() {
  return Object.entries(store)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 30); // 🔥 ostatnie 30
}