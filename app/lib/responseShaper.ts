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

function limitBold(text: string, max = 3) {
  const matches = text.match(/\*\*.*?\*\*/g);
  if (!matches || matches.length <= max) return text;

  let count = 0;
  return text.replace(/\*\*(.*?)\*\*/g, (_, content) => {
    count++;
    return count <= max ? `**${content}**` : content;
  });
}

function limitDashes(text: string, max = 4) {
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

function trimLength(text: string, max = 650) {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

export function shapeResponse({ text, softLimit, mode }: ShapeInput) {
  if (!text) return "";

  let cleaned = text.trim();
  cleaned = removeAiFluff(cleaned);

  cleaned = limitBold(cleaned);
  cleaned = limitDashes(cleaned);

  if (mode === "crisis") {
    if (softLimit && cleaned.length > 900) {
      return cleaned.slice(0, 850) + "...";
    }
    return cleaned;
  }

  if (softLimit) {
    return trimLength(cleaned, 500);
  }

  return trimLength(cleaned, 750);
}