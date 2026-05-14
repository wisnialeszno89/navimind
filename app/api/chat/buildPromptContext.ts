type PromptContextInput = {
  summary: string;
  entityContext: string;
  contextBlock: string;
};

export function buildPromptContext({
  summary,
  entityContext,
  contextBlock,
}: PromptContextInput) {
  return {
    summary,
    entityContext,
    contextBlock,
  };
}