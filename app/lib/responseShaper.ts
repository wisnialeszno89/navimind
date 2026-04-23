type ShapeInput = {
  text: string;
  softLimit?: boolean;
  mode?: string;
  };
  function removeAiFluff(text: string) {
  return text.replace(
    /^(Rozumiem|Widzę|To brzmi|Dziękuję za podzielenie się|Masz rację|Czuję, że)[^.\n]*[.\n]+/i,
    ""
  );
}

function limitBold(text: string, max = 4) {
  const matches = text.match(/\*\*.*?\*\*/g);
  if (!matches || matches.length <= max) return text;

  let count = 0;
  return text.replace(/\*\*(.*?)\*\*/g, (_, content) => {
    count++;
    return count <= max ? `**${content}**` : content;
  });
}

function limitDashes(text: string, max = 6) {
  const lines = text.split("\n");
  let dashCount = 0;

  return lines
    .map((line) => {
      if (line.trim().startsWith("-") || line.trim().startsWith("–")) {
        dashCount++;
        if (dashCount > max) return line.replace(/^[-–]\s*/, "");
      }
      return line;
    })
    .join("\n");
}
function detectLengthMode(text: string): "short" | "medium" | "deep" {
  const len = text.length;

  if (len < 120) return "short";
  if (len < 400) return "medium";
  return "deep";
}
export function shapeResponse({ text, softLimit, mode }: ShapeInput) {
  if (!text) return "";

  let cleaned = text.trim();
  const lengthMode = detectLengthMode(cleaned);

  // kosmetyka
  cleaned = removeAiFluff(cleaned);
  cleaned = limitBold(cleaned);
  cleaned = limitDashes(cleaned);

  // 🔴 kryzys = nic nie ruszamy
  if (mode === "crisis") {
    return cleaned;
  }
/* ===== INTELIGENTNA DŁUGOŚĆ ===== */

if (lengthMode === "short") {
  // zostaw jak jest → nie rozciągamy
  return cleaned;
}

if (lengthMode === "medium") {
  // lekka struktura → nic nie ucinamy
  return cleaned;
}

if (lengthMode === "deep") {
  // delikatne skrócenie jeśli za długie
  if (cleaned.length > 900) {
    return cleaned.slice(0, 850).trim() + "…";
  }
}
  // 🟡 soft limit → jeden spójny wariant
  if (softLimit) {
    return (
      cleaned +
      "\n\n— Możemy to rozwinąć głębiej, jeśli chcesz."
    );
  }

  /* ===== MOMENT CISZY ===== */

  const endsWithQuestion = cleaned.trim().endsWith("?");

  // tryby gdzie NIE chcemy ciszy
  const forceQuestionModes = ["clarify"];

  const shouldSilence =
    !endsWithQuestion &&
    !forceQuestionModes.includes(mode || "") &&
    Math.random() > 0.65;

  if (shouldSilence) {
    return cleaned; // zostawiamy bez pytania → cisza
  }

  return cleaned;
}