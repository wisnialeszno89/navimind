import { analyzeUserMessage } from "@/lib/analyzeUserMessage";

import { detectIntent } from "@/lib/brainRouter";

import { detectLocalIntent } from "@/lib/detectLocalIntent";

import { detectViolenceRisk } from "@/lib/violenceDetector";

type AnalyzeConversationInput = {
  userText: string;
};

export function analyzeConversation({
  userText,
}: AnalyzeConversationInput) {
  const analysis =
    analyzeUserMessage(
      userText
    );

  const intent =
    detectIntent(
      userText
    );

  const localIntent =
    detectLocalIntent(
      userText
    );

  const violenceRisk =
    detectViolenceRisk(
      userText
    );

  return {
    analysis,
    intent,
    localIntent,
    violenceRisk,
  };
}