type Input = {
  patterns: any[];
  memory: any;
};

export function buildEmotionalProfile({
  patterns,
  memory,
}: Input) {
  const joined =
    JSON.stringify(
      patterns
    ).toLowerCase() +
    " " +
    JSON.stringify(
      memory
    ).toLowerCase();

  const profile = {
    abandonmentFear:
      /odrzuc|samotn|zostaw/i.test(
        joined
      ),

    overload:
      /chaos|przeciąż|zmęcz|nie daje rady/i.test(
        joined
      ),

    controlNeed:
      /kontrol|musze ogarn|porzadek/i.test(
        joined
      ),

    validationSeeking:
      /czy jestem|czy to normalne|czy ja/i.test(
        joined
      ),
  };

  return profile;
}