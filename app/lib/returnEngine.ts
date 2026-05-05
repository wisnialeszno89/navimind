export function detectReturnContext(lastActive?: number | null): "short" | "medium" | "long" | null {
  if (!lastActive) return null;

  const diff = Date.now() - lastActive;
  const hours = diff / (1000 * 60 * 60);

  if (hours > 24) return "long";
  if (hours > 2) return "medium";
  if (hours > 0.1) return "short";

  return null;
}