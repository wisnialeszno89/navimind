export function detectReturnContext(lastActive: number | null): "short" | "medium" | "long" | null {
  if (!lastActive) return null;

  const diff = Date.now() - lastActive;

  const hours = diff / (1000 * 60 * 60);

  if (hours < 6) return null;
  if (hours < 24) return "short";
  if (hours < 72) return "medium";

  return "long";
}