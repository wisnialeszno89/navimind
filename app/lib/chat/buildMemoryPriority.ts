type Input = {
  memory: any;
  patterns: any[];
};

export function buildMemoryPriority({
  memory,
  patterns,
}: Input) {
  const joined =
    JSON.stringify(
      memory
    ).toLowerCase() +
    " " +
    JSON.stringify(
      patterns
    ).toLowerCase();

  const recurringTopics =
    [
      "relationship",
      "existential",
      "mental_overload",
      "work",
    ];

  const scores:
    Record<string, number> =
    {};

  recurringTopics.forEach(
    (topic) => {
      const matches =
        joined.match(
          new RegExp(
            topic,
            "g"
          )
        );

      scores[topic] =
        matches
          ? matches.length
          : 0;
    }
  );

  const topTopic =
    Object.entries(
      scores
    ).sort(
      (a, b) =>
        b[1] - a[1]
    )[0];

  return {
    scores,
    topPriority:
      topTopic?.[0] ||
      "general",
  };
}