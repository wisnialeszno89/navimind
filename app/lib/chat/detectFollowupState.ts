import { detectContinuation } from "@/lib/detectContinuation";

import { detectAffirmative } from "@/lib/detectAffirmative";

type DetectFollowupStateInput = {
  userText: string;
};

function isDependentFollowup(
  text: string
): boolean {
  const t =
    text
      .trim()
      .toLowerCase();

  const contextualPatterns =
    /po co|dlaczego|czemu|i co|czyli|serio|dokładnie|właśnie|rozwiń|wyjaśnij|tak naprawdę/i;

  const vagueReferences =
    /\b(to|tego|tym|taka|takie|tak)\b/i;

  return (
    t.length < 180 &&
    (
      contextualPatterns.test(
        t
      ) ||
      vagueReferences.test(
        t
      )
    )
  );
}

export function detectFollowupState({
  userText,
}: DetectFollowupStateInput) {
  const shortFollowup =
    isDependentFollowup(
      userText
    );

  const continuationIntent =
    detectContinuation(
      userText
    );

  const affirmativeIntent =
    detectAffirmative(
      userText
    );

  return {
    shortFollowup,
    continuationIntent,
    affirmativeIntent,
  };
}