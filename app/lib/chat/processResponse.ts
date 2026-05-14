import { shapeResponse } from "@/lib/responseShaper";

import { formatResponse } from "@/lib/outputEngine";

type ProcessResponseInput = {
  aiText: string;
};

export function processResponse({
  aiText,
}: ProcessResponseInput) {
  const {
    text,
    usedEffect,
  } = shapeResponse({
    text: aiText,
  });

  let finalOutput =
    text;

  finalOutput =
    finalOutput
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();

  finalOutput =
    formatResponse(
      finalOutput
    );

  finalOutput =
    finalOutput.replace(
      /^\d+\.\s*\*\*/gm,
      "• **"
    );

  return {
    finalOutput,
    usedEffect,
  };
}