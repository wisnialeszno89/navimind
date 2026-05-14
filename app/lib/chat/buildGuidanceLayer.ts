type Input = {
  intelligence: any;
  userContext: any;
};

export function buildGuidanceLayer({
  intelligence,
  userContext,
}: Input) {
  const {
    emotionalProfile,
    activeTopic,
  } = userContext;

  const guidance: string[] =
    [];

  if (
    emotionalProfile
      ?.overload
  ) {
    guidance.push(
      "Help the user simplify chaos and focus on one thing at a time."
    );
  }

  if (
    emotionalProfile
      ?.validationSeeking
  ) {
    guidance.push(
      "Avoid artificial reassurance. Help the user think clearly instead."
    );
  }

  if (
    emotionalProfile
      ?.abandonmentFear
  ) {
    guidance.push(
      "Avoid sounding rejecting or emotionally cold."
    );
  }

  if (
    activeTopic ===
    "relationship"
  ) {
    guidance.push(
      "Relationship context is emotionally important for the user."
    );
  }

  if (
    activeTopic ===
    "mental_overload"
  ) {
    guidance.push(
      "Prioritize clarity, grounding and structure."
    );
  }

  return guidance.join(
    "\n"
  );
}