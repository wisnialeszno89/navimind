type Input = {
  userText: string;
  mode: string;
};

export type ResponseStrategy =
  | "natural"
  | "direct"
  | "supportive"
  | "reflective";

export function detectResponseStrategy({
  userText,
  mode,
}: Input): ResponseStrategy {
  const t = userText.toLowerCase();

  // 🔹 techniczne
  if (mode === "technical") {
    return "direct";
  }

  // 🔹 refleksja / psychologia / społeczne
  if (
    /czemu|dlaczego|ego|ludzie|relacje|zachowanie|emocje|sens|uwagę|potrzeba|samotność|udają|manipulacja/.test(
      t
    )
  ) {
    return "reflective";
  }

  // 🔹 wsparcie
  if (
    /mam dość|ciężko|boję|smutek|samotny|pomóż|męczy/.test(
      t
    )
  ) {
    return "supportive";
  }

  return "natural";
}