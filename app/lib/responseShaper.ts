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
export function shapeResponse(
  baseText: string,
  intent: string,
  userText: string
) {
  // 🔥 MOTIVE (najważniejsze dla Twojego case)
  if (intent === "motive") {
    return (
      "To nie jest jedna rzecz.\n\n" +
      "Ona może z tego mieć kilka rzeczy naraz.\n\n" +
      "**Kontrolę** — bo decyduje kiedy masz dostęp.\n\n" +
      "**Wyrównanie emocji** — jeśli czuje złość, to to jest forma oddania.\n\n" +
      "**Przewagę** — bo układ jest po jej stronie.\n\n" +
      "To nie musi być świadome.\n\n" +
      "Ale efekt jest taki, że to nie jest o dzieciach — tylko o tym, co jest między wami."
    );
  }

  // 🔥 EXPLAIN
  if (intent === "explain") {
    return baseText.replace("To znaczy że", "W praktyce wygląda to tak:");
  }

  // 🔥 EMOTIONAL (bez doradzania)
  if (intent === "emotional") {
    return baseText.split(".")[0] + ".";
  }

  return baseText;
}