import { SYSTEM_PROMPT } from "./systemPrompt";
import { COHERENCE_RULES } from "./coherenceRules";

/**
 * RDZEŃ TOŻSAMOŚCI NAVIMIND
 * 
 * System prompt NIE zależy od usera.
 * Ma być stały, spokojny i spójny.
 */
export function buildSystemPrompt(): string {
  return `
${SYSTEM_PROMPT}

${COHERENCE_RULES}
`;
}
