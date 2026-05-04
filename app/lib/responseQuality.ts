export function improveResponse(text: string): string {
  let t = (text || "").trim();

  if (!t) {
    return "Napisz to jeszcze raz — złapiemy to dokładniej.";
  }

  /* ========= 1. CLEAN ========= */

  t = t.replace(/\bnp\.?,?$/i, "").trim();
  t = t.replace(/\.\.\.+$/, "");
  t = t.replace(/\s+/g, " ").trim();

  /* ========= 2. REMOVE GENERIC PHRASES ========= */

  const banned = [
    "to normalne",
    "warto zauważyć",
    "to pokazuje",
    "to moment",
    "emocje są",
    "mózg",
    "proces",
  ];

  for (const phrase of banned) {
    if (t.toLowerCase().includes(phrase)) {
      t = t.replace(new RegExp(phrase, "gi"), "");
    }
  }

  /* ========= 3. SHORTEN ========= */

  const sentences = t
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 2) {
    t = sentences.slice(0, 2).join(". ") + ".";
  }

  /* ========= 4. FORCE END ========= */

  if (!/[.!?]$/.test(t)) {
    t += ".";
  }

  return t.trim();
}