export const KNOWLEDGE_CONTEXT_VERSION = "1" as const;

export type KnowledgeStatus =
  | "empty"
  | "partial"
  | "complete"
  | "conflict"
  | "error";

export type AgentKnowledgeSource = {
  source_id: string;
  title: string;
  url: string;
  domain?: string;
  source_type: string;
  retrieved_at?: string;
  published_at?: string;
};

export type AgentKnowledgeFact = {
  fact_id: string;
  claim: string;
  source_ids: string[];
  confidence: number;
  relevance: number;
  evidence?: string;
  kind?: "assertion" | "retrieved_evidence";
  provider_score?: number;
};

export type AgentKnowledgeConflict = {
  conflict_id: string;
  topic: string;
  fact_ids: string[];
  description?: string;
};

export type AgentKnowledgeContext = {
  version: typeof KNOWLEDGE_CONTEXT_VERSION;
  status: KnowledgeStatus;
  query: string | null;
  facts: AgentKnowledgeFact[];
  sources: AgentKnowledgeSource[];
  conflicts: AgentKnowledgeConflict[];
  limitations: string[];
};

export type AgentKnowledgeEnvelope = {
  version: typeof KNOWLEDGE_CONTEXT_VERSION;
  local: Record<string, unknown> | null;
  external: AgentKnowledgeContext | null;
};

const MAX_FACTS = 32;
const MAX_SOURCES = 32;
const MAX_CONFLICTS = 16;
const MAX_LIMITATIONS = 16;
const MAX_STRING_LENGTH = 4000;
const MAX_URL_LENGTH = 2000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function requireString(
  value: unknown,
  field: string,
  maxLength = MAX_STRING_LENGTH
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`knowledge_invalid_${field}`);
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new Error(`knowledge_invalid_${field}_length`);
  }

  return normalized;
}

function validateScore(value: unknown, field: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(`knowledge_invalid_${field}`);
  }

  return value;
}

function validateSource(
  value: unknown,
  index: number
): AgentKnowledgeSource {
  if (!isRecord(value)) {
    throw new Error(`knowledge_invalid_source_${index}`);
  }

  const sourceId = requireString(value.source_id, `source_${index}_id`, 128);
  const title = requireString(value.title, `source_${index}_title`, 500);
  const url = requireString(value.url, `source_${index}_url`, MAX_URL_LENGTH);
  const sourceType = requireString(
    value.source_type ?? "web",
    `source_${index}_type`,
    64
  );

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`knowledge_invalid_source_${index}_url`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`knowledge_invalid_source_${index}_url_protocol`);
  }

  const domain =
    value.domain == null
      ? undefined
      : requireString(value.domain, `source_${index}_domain`, 255);

  const retrievedAt =
    value.retrieved_at == null
      ? undefined
      : requireString(value.retrieved_at, `source_${index}_retrieved_at`, 64);

  const publishedAt =
    value.published_at == null
      ? undefined
      : requireString(value.published_at, `source_${index}_published_at`, 64);

  return {
    source_id: sourceId,
    title,
    url,
    source_type: sourceType,
    ...(domain ? { domain } : {}),
    ...(retrievedAt ? { retrieved_at: retrievedAt } : {}),
    ...(publishedAt ? { published_at: publishedAt } : {}),
  };
}

function validateFact(
  value: unknown,
  index: number,
  sourceIds: Set<string>
): AgentKnowledgeFact {
  if (!isRecord(value)) {
    throw new Error(`knowledge_invalid_fact_${index}`);
  }

  const factId = requireString(value.fact_id, `fact_${index}_id`, 128);
  const claim = requireString(value.claim, `fact_${index}_claim`);
  const rawSourceIds = value.source_ids;

  if (!Array.isArray(rawSourceIds)) {
    throw new Error(`knowledge_invalid_fact_${index}_source_ids`);
  }

  const sourceIdsForFact = rawSourceIds.map((sourceId, sourceIndex) =>
    requireString(
      sourceId,
      `fact_${index}_source_${sourceIndex}`,
      128
    )
  );

  for (const sourceId of sourceIdsForFact) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`knowledge_unknown_source_${sourceId}`);
    }
  }

  const rawKind = value.kind;
  if (
    rawKind !== undefined &&
    rawKind !== "assertion" &&
    rawKind !== "retrieved_evidence"
  ) {
    throw new Error(`knowledge_invalid_fact_${index}_kind`);
  }

  const providerScore =
    value.provider_score == null
      ? undefined
      : validateScore(
          value.provider_score,
          `fact_${index}_provider_score`
        );

  return {
    fact_id: factId,
    claim,
    source_ids: sourceIdsForFact,
    confidence: validateScore(
      value.confidence,
      `fact_${index}_confidence`
    ),
    relevance: validateScore(
      value.relevance,
      `fact_${index}_relevance`
    ),
    kind: rawKind ?? "assertion",
    ...(providerScore !== undefined
      ? { provider_score: providerScore }
      : {}),
    ...(value.evidence == null
      ? {}
      : {
          evidence: requireString(
            value.evidence,
            `fact_${index}_evidence`
          ),
        }),
  };
}

function validateConflict(
  value: unknown,
  index: number,
  factIds: Set<string>
): AgentKnowledgeConflict {
  if (!isRecord(value)) {
    throw new Error(`knowledge_invalid_conflict_${index}`);
  }

  const conflictId = requireString(
    value.conflict_id,
    `conflict_${index}_id`,
    128
  );
  const topic = requireString(
    value.topic,
    `conflict_${index}_topic`
  );

  if (!Array.isArray(value.fact_ids)) {
    throw new Error(`knowledge_invalid_conflict_${index}_fact_ids`);
  }

  const factIdsForConflict = value.fact_ids.map((factId, factIndex) =>
    requireString(
      factId,
      `conflict_${index}_fact_${factIndex}`,
      128
    )
  );

  for (const factId of factIdsForConflict) {
    if (!factIds.has(factId)) {
      throw new Error(`knowledge_unknown_fact_${factId}`);
    }
  }

  const description =
    value.description == null
      ? undefined
      : requireString(
          value.description,
          `conflict_${index}_description`
        );

  return {
    conflict_id: conflictId,
    topic,
    fact_ids: factIdsForConflict,
    ...(description ? { description } : {}),
  };
}

function validateExternalContext(
  value: unknown
): AgentKnowledgeContext {
  if (!isRecord(value)) {
    throw new Error("knowledge_external_not_object");
  }

  if (value.version !== KNOWLEDGE_CONTEXT_VERSION) {
    throw new Error("knowledge_external_version");
  }

  const status = value.status;

  if (
    status !== "empty" &&
    status !== "partial" &&
    status !== "complete" &&
    status !== "conflict" &&
    status !== "error"
  ) {
    throw new Error("knowledge_external_status");
  }

  const query =
    value.query == null
      ? null
      : requireString(value.query, "query", 1000);

  if (!Array.isArray(value.sources) || value.sources.length > MAX_SOURCES) {
    throw new Error("knowledge_sources_limit");
  }

  const sources = value.sources.map(validateSource);
  const sourceIds = new Set<string>();

  for (const source of sources) {
    if (sourceIds.has(source.source_id)) {
      throw new Error(`knowledge_duplicate_source_${source.source_id}`);
    }
    sourceIds.add(source.source_id);
  }

  if (!Array.isArray(value.facts) || value.facts.length > MAX_FACTS) {
    throw new Error("knowledge_facts_limit");
  }

  const facts = value.facts.map((fact, index) =>
    validateFact(fact, index, sourceIds)
  );
  const factIds = new Set<string>();

  for (const fact of facts) {
    if (factIds.has(fact.fact_id)) {
      throw new Error(`knowledge_duplicate_fact_${fact.fact_id}`);
    }
    factIds.add(fact.fact_id);
  }

  if (
    !Array.isArray(value.conflicts) ||
    value.conflicts.length > MAX_CONFLICTS
  ) {
    throw new Error("knowledge_conflicts_limit");
  }

  const conflicts = value.conflicts.map((conflict, index) =>
    validateConflict(conflict, index, factIds)
  );
  const conflictIds = new Set<string>();

  for (const conflict of conflicts) {
    if (conflictIds.has(conflict.conflict_id)) {
      throw new Error(
        `knowledge_duplicate_conflict_${conflict.conflict_id}`
      );
    }
    conflictIds.add(conflict.conflict_id);
  }

  if (
    !Array.isArray(value.limitations) ||
    value.limitations.length > MAX_LIMITATIONS
  ) {
    throw new Error("knowledge_limitations_limit");
  }

  const limitations = value.limitations.map((limitation, index) =>
    requireString(limitation, `limitation_${index}`)
  );

  return {
    version: KNOWLEDGE_CONTEXT_VERSION,
    status,
    query,
    facts,
    sources,
    conflicts,
    limitations,
  };
}

export function validateAgentKnowledgeEnvelope(
  value: unknown
): AgentKnowledgeEnvelope {
  if (value == null) {
    return {
      version: KNOWLEDGE_CONTEXT_VERSION,
      local: null,
      external: null,
    };
  }

  if (!isRecord(value)) {
    throw new Error("knowledge_not_object");
  }

  if (value.version !== KNOWLEDGE_CONTEXT_VERSION) {
    throw new Error("knowledge_version");
  }

  const local =
    value.local == null
      ? null
      : isRecord(value.local)
        ? value.local
        : (() => {
            throw new Error("knowledge_local_not_object");
          })();

  const external =
    value.external == null
      ? null
      : validateExternalContext(value.external);

  return {
    version: KNOWLEDGE_CONTEXT_VERSION,
    local,
    external,
  };
}
