type Input = {
  memory: any;
  patterns: any[];
};

export function buildActiveTopic({
  memory,
  patterns,
}: Input) {
  const combined =
    JSON.stringify(
      memory
    ).toLowerCase() +
    " " +
    JSON.stringify(
      patterns
    ).toLowerCase();

  if (
    /rozstanie|związek|żona|samotn/i.test(
      combined
    )
  ) {
    return "relationship";
  }

  if (
    /praca|firma|biznes|pieniadz/i.test(
      combined
    )
  ) {
    return "work";
  }

  if (
    /depres|chaos|zmecz|przeciąż/i.test(
      combined
    )
  ) {
    return "mental_overload";
  }

  if (
    /sens|świadomo|matrix|dusza/i.test(
      combined
    )
  ) {
    return "existential";
  }

  return "general";
}