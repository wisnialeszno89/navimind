import type { AgentKnowledgeContext } from "../knowledgeContext";

export type ResearchDepth = "fast" | "basic" | "advanced";

export type ResearchDecision = {
  required: boolean;
  query: string | null;
  rationale: string;
  confidence: number;
};

export type ResearchOptions = {
  maxResults: number;
  searchDepth: ResearchDepth;
  topic: "general" | "news" | "finance";
  timeoutMs: number;
};

export type ResearchSearchResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string | null;
};

export type ResearchProviderResponse = {
  query: string;
  results: ResearchSearchResult[];
};

export type ResearchEngineResult = {
  status: AgentKnowledgeContext["status"];
  knowledge: AgentKnowledgeContext;
  provider: "tavily" | "none";
  required: boolean;
  query: string | null;
  error?: string;
};