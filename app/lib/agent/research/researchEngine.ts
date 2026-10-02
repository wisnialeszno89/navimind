import OpenAI from "openai";
import {
  type AgentKnowledgeContext,
  type AgentKnowledgeFact,
  type AgentKnowledgeSource,
} from "../knowledgeContext";
import type { AgentTaskContract } from "../agentTaskContract";
import { searchTavily } from "./tavilySearchProvider";
import {
  type ResearchDecision,
  type ResearchEngineResult,
  type ResearchOptions,
  type ResearchProviderResponse,
} from "./researchTypes";

const MAX_QUERY_LENGTH = 1000;
const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_TIMEOUT_MS = 15_000;

const DECISION_PROMPT = `
Jesteś modułem decydującym, czy agent potrzebuje zewnętrznej wiedzy z internetu.

Oceń wyłącznie:
- cel użytkownika,
- intencję,
- lokalną wiedzę aplikacyjną,
- istniejącą wiedzę zewnętrzną.

Nie wykonujesz żadnej akcji i nie wydajesz instrukcji wykonawczych.

Zwróć wyłącznie JSON:
{
  "required": true lub false,
  "query": "krótkie zapytanie do internetu albo null",
  "rationale": "krótkie uzasadnienie",
  "confidence": liczba 0..1
}

Ustaw required=true tylko wtedy, gdy zewnętrzna informacja jest istotna
dla poprawnego wykonania celu i nie wynika wystarczająco z dostarczonego kontekstu.
Jeżeli wiedza jest wystarczająca, ustaw required=false.
Nie wymyślaj danych.
`.trim();

function safeQuery(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();

  if (!normalized || normalized.length > MAX_QUERY_LENGTH) {
    return null;
  }

  return normalized;
}

function safeConfidence(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function buildKnowledgeFromSearch(
  response: ResearchProviderResponse
): AgentKnowledgeContext {
  const sources: AgentKnowledgeSource[] = [];
  const facts: AgentKnowledgeFact[] = [];
  const sourceIds = new Set<string>();

  response.results.forEach((result, index) => {
    let url: URL;

    try {
      url = new URL(result.url);
    } catch {
      return;
    }

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return;
    }

    const sourceId = `web-${index + 1}`;

    if (sourceIds.has(sourceId)) {
      return;
    }

    sourceIds.add(sourceId);

    sources.push({
      source_id: sourceId,
      title: result.title,
      url: result.url,
      domain: url.hostname,
      source_type: "web_search_result",
      published_at: result.published_date || undefined,
    });

    facts.push({
      fact_id: `evidence-${index + 1}`,
      claim: result.content,
      source_ids: [sourceId],
      confidence: 0,
      relevance: result.score ?? 0,
      evidence: result.content,
      kind: "retrieved_evidence",
      ...(result.score !== undefined
        ? { provider_score: result.score }
        : {}),
    });
  });

  return {
    version: "1",
    status: facts.length ? "complete" : "partial",
    query: response.query,
    facts,
    sources,
    conflicts: [],
    limitations: facts.length
      ? [
          "Retrieved evidence is not independently verified.",
          "Search ranking is not a truth guarantee.",
        ]
      : [
          "No usable web results were returned.",
        ],
  };
}

async function decideResearch(
  task: AgentTaskContract
): Promise<ResearchDecision> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model:
      process.env.NAVIMIND_AGENT_RESEARCH_MODEL ||
      process.env.NAVIMIND_AGENT_MODEL ||
      "gpt-4.1-mini",
    temperature: 0,
    max_tokens: 220,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: DECISION_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify({
          goal: task.goal,
          intent: task.intent,
          application_knowledge: task.knowledge?.local ?? null,
          external_knowledge: task.knowledge?.external ?? null,
        }),
      },
    ],
  });

  const raw =
    response.choices?.[0]?.message?.content?.trim() ||
    "";

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {
      required: false,
      query: null,
      rationale: "Research decision returned invalid JSON.",
      confidence: 0,
    };
  }

  const required = parsed.required === true;
  const query = safeQuery(parsed.query);

  return {
    required: required && Boolean(query),
    query,
    rationale:
      typeof parsed.rationale === "string"
        ? parsed.rationale.trim()
        : "",
    confidence: safeConfidence(parsed.confidence),
  };
}

function optionsFromTask(
  task: AgentTaskContract
): ResearchOptions {
  const constraints = task.constraints || {};

  const rawMaxResults = Number(
    constraints.research_max_results ??
      process.env.NAVIMIND_RESEARCH_MAX_RESULTS ??
      DEFAULT_MAX_RESULTS
  );

  const maxResults = Math.min(
    10,
    Math.max(
      1,
      Number.isFinite(rawMaxResults)
        ? Math.trunc(rawMaxResults)
        : DEFAULT_MAX_RESULTS
    )
  );

  const depth =
    constraints.research_depth ??
    process.env.NAVIMIND_RESEARCH_DEPTH ??
    "basic";

  const searchDepth =
    depth === "fast" ||
    depth === "advanced" ||
    depth === "basic"
      ? depth
      : "basic";

  const rawTimeout = Number(
    constraints.research_timeout_ms ??
      process.env.NAVIMIND_RESEARCH_TIMEOUT_MS ??
      DEFAULT_TIMEOUT_MS
  );

  const timeoutMs = Math.min(
    30_000,
    Math.max(
      2_000,
      Number.isFinite(rawTimeout)
        ? Math.trunc(rawTimeout)
        : DEFAULT_TIMEOUT_MS
    )
  );

  const rawTopic = constraints.research_topic;
  const topic =
    rawTopic === "news" || rawTopic === "finance"
      ? rawTopic
      : "general";

  return {
    maxResults,
    searchDepth,
    topic,
    timeoutMs,
  };
}

export async function researchAgentTask(
  task: AgentTaskContract
): Promise<ResearchEngineResult> {
  const existing = task.knowledge?.external;

  if (
    existing &&
    (
      existing.status === "complete" ||
      existing.status === "conflict"
    ) &&
    (existing.facts.length > 0 || existing.conflicts.length > 0)
  ) {
    return {
      status: existing.status,
      knowledge: existing,
      provider: "none",
    };
  }

  try {
    const decision = await decideResearch(task);

    if (!decision.required || !decision.query) {
      return {
        status: "empty",
        knowledge: {
          version: "1",
          status: "empty",
          query: null,
          facts: [],
          sources: [],
          conflicts: [],
          limitations: [
            decision.rationale ||
              "External research was not required.",
          ],
        },
        provider: "none",
      };
    }

    const response = await searchTavily(
      decision.query,
      optionsFromTask(task)
    );

    const knowledge = buildKnowledgeFromSearch(response);

    return {
      status: knowledge.status,
      knowledge,
      provider: "tavily",
    };
  } catch (error) {
    return {
      status: "error",
      knowledge: {
        version: "1",
        status: "error",
        query: null,
        facts: [],
        sources: [],
        conflicts: [],
        limitations: [
          error instanceof Error
            ? error.message
            : "Research provider failed.",
        ],
      },
      provider: "tavily",
      error:
        error instanceof Error
          ? error.message
          : "RESEARCH_FAILED",
    };
  }
}