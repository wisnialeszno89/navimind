type Input = {
  userText: string;
  history: any[];
};

export function buildTopicAnchor({
  userText,
  history,
}: Input) {
  const joined =
    [
      ...history.map(
        (m) => m.content
      ),
      userText,
    ]
      .join(" ")
      .toLowerCase();

  const anchors: string[] =
    [];

  if (
    /góry sowie|sowie/i.test(
      joined
    )
  ) {
    anchors.push(
      "Góry Sowie"
    );
  }

  if (
    /kamper|camping/i.test(
      joined
    )
  ) {
    anchors.push(
      "kamper"
    );
  }

  if (
    /parking|postój/i.test(
      joined
    )
  ) {
    anchors.push(
      "parking"
    );
  }

  return anchors;
}