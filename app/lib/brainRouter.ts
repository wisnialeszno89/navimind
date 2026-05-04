export type Mode = "support" | "direction" | "action" | "heavy";

export function detectMode(userText: string, analysis: any, history: any[]): Mode {
  const t = userText.toLowerCase();

  if (
    analysis.state === "emotional" ||
    /dzieci|rozpad|depresja|strata|wykluczony/.test(t)
  ) {
    return "heavy";
  }

  if (/co zrobić|jak|co robic/.test(t)) return "direction";

  if (/robię|zrobiłem|działam/.test(t)) return "action";

  return "support";
}

export function isLooping(history: any[]) {
  const last = history.slice(-3).map((m) => m.content.toLowerCase());

  if (last.length < 3) return false;

  return (
    last[0].includes("nie wiem") &&
    last[1].includes("nie wiem") &&
    last[2].includes("nie wiem")
  );
}

export function shouldAllowQuestion(history: any[]) {
  const lastAssistant = history
    .filter((m) => m.role === "assistant")
    .slice(-2)
    .map((m) => m.content);

  return !lastAssistant.some((msg) => msg.includes("?"));
}

export function isFirstHeavyMessage(history: any[]) {
  const assistantMessages = history.filter(m => m.role === "assistant");
  return assistantMessages.length < 1;
}
export type Intent = "explain" | "motive" | "action" | "emotional" | "general";

export function detectIntent(userText: string): Intent {
  const t = userText.toLowerCase();

  if (/co z tego ma|po co ona|dlaczego ona/.test(t)) return "motive";
  if (/dlaczego|czemu/.test(t)) return "explain";
  if (/co zrobić|jak/.test(t)) return "action";
  if (/czuję|mam dość|wykańcza/.test(t)) return "emotional";

  return "general";
}
