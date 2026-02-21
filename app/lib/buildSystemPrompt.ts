import { SYSTEM_PROMPT } from "./systemPrompt";
import { COHERENCE_RULES } from "./coherenceRules";

export function buildSystemPrompt(): string {
  return `
${COHERENCE_RULES}

${SYSTEM_PROMPT}
`;
}