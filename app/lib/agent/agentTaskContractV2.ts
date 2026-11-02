/**
 * Strict, provider-neutral request/response contract for Agent Observe/Act v2.
 * Mirrors app/agent/bridge/agent_task_contract_v2.py. This module validates
 * model-facing data only; it never resolves local references or authorizes work.
 */

export type AgentTaskV2Request = {
  version: "2";
  task_id: string;
  goal: string;
  intent: string;
  session_id: string | null;
  task_state: {
    cycle: number;
    max_cycles: number;
    reasoning_calls_remaining: number;
  };
  world: {
    revision: number;
    observed_at: string;
    application: string | null;
    window_title: string | null;
    entities: Array<Record<string, unknown>>;
    relationships: Array<Record<string, unknown>>;
    affordances: Array<Record<string, unknown>>;
    evidence: Array<Record<string, unknown>>;
  };
  capabilities: {
    observations: Array<Record<string, unknown>>;
    actions: Array<Record<string, unknown>>;
  };
  knowledge: Record<string, unknown> | null;
  experience: Array<Record<string, unknown>>;
  constraints: {
    max_observations_per_cycle: number;
    max_observation_items: number;
    max_evidence_bytes: number;
    semantic_only: true;
    verify_each_action: true;
  };
  metadata: Record<string, unknown>;
};

export type AgentTaskV2Response = {
  version: "2";
  task_id: string;
  decision: "observe" | "act" | "done" | "manual_review";
  rationale: string;
  confidence: number;
  observation_request: Record<string, unknown> | null;
  action: Record<string, unknown> | null;
  completion: Record<string, unknown> | null;
  requires_manual_review: boolean;
};

const MAX_BODY_BYTES = 256 * 1024;
const MAX_ENTITIES = 200;
const MAX_RELATIONSHIPS = 400;
const MAX_AFFORDANCES = 200;
const MAX_EVIDENCE_ITEMS = 100;
const MAX_CAPABILITIES = 64;
const MAX_EXPERIENCE_ITEMS = 20;
const MAX_OBSERVATION_ITEMS = 50;
const REF_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;
const FORBIDDEN_KEYS = new Set([
  "x", "y", "left", "top", "right", "bottom", "hwnd", "window_handle",
  "runtime_id", "automation_id", "selector", "selectors", "provider_id",
  "native_id", "executor", "coordinates", "screen_coordinates", "screen_coordinate",
]);
const OBSERVATION_CONTRACTS = new Set([
  "entity_inspection_v1", "children_page_v1", "table_page_v1",
]);
const POSTCONDITIONS = new Set([
  "entity_present", "entity_value_equals", "entity_state_equals",
  "relationship_exists", "application_state_equals",
]);

function fail(message: string): never {
  throw new Error("agent_task_v2:" + message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function object(
  value: unknown,
  name: string,
  allowed?: readonly string[],
  required: readonly string[] = [],
): Record<string, unknown> {
  if (!isRecord(value)) fail(name + "_must_be_object");
  const keys = Object.keys(value);
  if (allowed) {
    const extra = keys.filter((key) => !allowed.includes(key));
    if (extra.length) fail(name + "_unknown_fields:" + extra.sort().join(","));
  }
  const missing = required.filter((key) => !Object.prototype.hasOwnProperty.call(value, key));
  if (missing.length) fail(name + "_missing_fields:" + missing.sort().join(","));
  return value;
}

function text(
  value: unknown,
  name: string,
  maximum: number,
  options: { nullable?: boolean; nonempty?: boolean } = {},
): asserts value is string | null {
  if (options.nullable && value === null) return;
  if (typeof value !== "string") fail(name + "_must_be_text");
  if (value.length > maximum) fail(name + "_too_long");
  if (options.nonempty !== false && value.trim().length === 0) fail(name + "_must_not_be_empty");
}

function integer(value: unknown, name: string, minimum: number, maximum: number): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value)) fail(name + "_must_be_integer");
  if (value < minimum || value > maximum) fail(name + "_out_of_bounds");
}

function numeric(value: unknown, name: string, minimum: number, maximum: number): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(name + "_must_be_number");
  if (value < minimum || value > maximum) fail(name + "_out_of_bounds");
}

function ref(value: unknown, name: string): string {
  text(value, name, 128);
  if (!REF_PATTERN.test(value)) fail(name + "_invalid_format");
  return value;
}

function refList(value: unknown, name: string, maximum: number): Set<string> {
  if (!Array.isArray(value) || value.length > maximum) fail(name + "_invalid_list");
  const refs = value.map((item) => ref(item, name));
  if (new Set(refs).size !== refs.length) fail(name + "_contains_duplicates");
  return new Set(refs);
}

function jsonValue(value: unknown, name: string, depth = 0): void {
  if (depth > 5) fail(name + "_too_deep");
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    if (typeof value === "number" && !Number.isFinite(value)) fail(name + "_non_finite_number");
    return;
  }
  if (typeof value === "string") {
    if (value.length > 4_000) fail(name + "_text_too_long");
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) fail(name + "_list_too_large");
    value.forEach((item, index) => jsonValue(item, name + "[" + index + "]", depth + 1));
    return;
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length > 50) fail(name + "_object_too_large");
    for (const key of keys) {
      if (key.length > 128) fail(name + "_invalid_key");
      const normalized = key.trim().toLowerCase().replace(/-/g, "_");
      if (FORBIDDEN_KEYS.has(normalized)) fail(name + "_contains_provider_field:" + normalized);
      jsonValue(value[key], name + "." + key, depth + 1);
    }
    return;
  }
  fail(name + "_contains_non_json_value");
}

function validateTaskState(value: unknown): void {
  const state = object(value, "task_state",
    ["cycle", "max_cycles", "reasoning_calls_remaining"],
    ["cycle", "max_cycles", "reasoning_calls_remaining"]);
  integer(state.cycle, "task_state.cycle", 0, 1_000);
  integer(state.max_cycles, "task_state.max_cycles", 1, 1_000);
  integer(state.reasoning_calls_remaining, "task_state.reasoning_calls_remaining", 0, 100);
  if ((state.cycle as number) > (state.max_cycles as number)) fail("task_state_cycle_exceeds_max");
}

function validateWorld(value: unknown): {
  revision: number;
  entityRefs: Set<string>;
  evidenceRefs: Set<string>;
} {
  const world = object(value, "world",
    ["revision", "observed_at", "application", "window_title", "entities", "relationships", "affordances", "evidence"],
    ["revision", "observed_at", "application", "window_title", "entities", "relationships", "affordances", "evidence"]);
  integer(world.revision, "world.revision", 0, 2_000_000_000);
  const revision = world.revision as number;
  text(world.observed_at, "world.observed_at", 64);
  text(world.application, "world.application", 256, { nullable: true });
  text(world.window_title, "world.window_title", 2_000, { nullable: true });

  if (!Array.isArray(world.entities) || world.entities.length > MAX_ENTITIES) fail("world.entities_invalid");
  const entities = world.entities.map((raw) => {
    const entity = object(raw, "world_entity",
      ["ref", "type", "label", "state", "attributes", "confidence", "evidence_refs"],
      ["ref", "type", "label", "state", "attributes", "confidence", "evidence_refs"]);
    const entityRef = ref(entity.ref, "entity.ref");
    text(entity.type, "entity.type", 128);
    text(entity.label, "entity.label", 1_000, { nullable: true });
    object(entity.state, "entity.state");
    jsonValue(entity.state, "entity.state");
    if (!Array.isArray(entity.attributes) || entity.attributes.length > 32) fail("entity.attributes_invalid");
    const names = new Set<string>();
    for (const rawAttribute of entity.attributes) {
      const attribute = object(rawAttribute, "entity.attribute", ["name", "value"], ["name", "value"]);
      text(attribute.name, "entity.attribute.name", 128);
      if (names.has(attribute.name as string)) fail("entity.attribute_duplicate_name");
      names.add(attribute.name as string);
      jsonValue(attribute.value, "entity.attribute.value");
    }
    numeric(entity.confidence, "entity.confidence", 0, 1);
    refList(entity.evidence_refs, "entity.evidence_refs", 32);
    return { ref: entityRef, evidenceRefs: entity.evidence_refs as unknown[] };
  });
  const entityRefs = new Set(entities.map((entity) => entity.ref));
  if (entityRefs.size !== entities.length) fail("world.entity_refs_duplicate");

  if (!Array.isArray(world.evidence) || world.evidence.length > MAX_EVIDENCE_ITEMS) fail("world.evidence_invalid");
  const evidence = world.evidence.map((raw) => {
    const item = object(raw, "world_evidence",
      ["ref", "source", "observed_at", "world_revision", "scope", "confidence", "content", "limitations", "redactions"],
      ["ref", "source", "observed_at", "world_revision", "scope", "confidence", "content", "limitations"]);
    const evidenceRef = ref(item.ref, "evidence.ref");
    text(item.source, "evidence.source", 64);
    text(item.observed_at, "evidence.observed_at", 64);
    integer(item.world_revision, "evidence.world_revision", 0, revision);
    text(item.scope, "evidence.scope", 512);
    if (item.confidence !== null) numeric(item.confidence, "evidence.confidence", 0, 1);
    object(item.content, "evidence.content");
    jsonValue(item.content, "evidence.content");
    if (!Array.isArray(item.limitations) || item.limitations.length > 16) fail("evidence.limitations_invalid");
    item.limitations.forEach((entry) => text(entry, "evidence.limitation", 1_000));
    if ("redactions" in item) {
      if (!Array.isArray(item.redactions) || item.redactions.length > 32) fail("evidence.redactions_invalid");
      item.redactions.forEach((entry) => text(entry, "evidence.redaction", 256));
    }
    return evidenceRef;
  });
  const evidenceRefs = new Set(evidence);
  if (evidenceRefs.size !== evidence.length) fail("world.evidence_refs_duplicate");
  for (const entity of entities) {
    const refs = refList(entity.evidenceRefs, "entity.evidence_refs", 32);
    if ([...refs].some((item) => !evidenceRefs.has(item))) fail("entity.references_unknown_evidence");
  }

  if (!Array.isArray(world.relationships) || world.relationships.length > MAX_RELATIONSHIPS) fail("world.relationships_invalid");
  for (const raw of world.relationships) {
    const item = object(raw, "world.relationship",
      ["from_ref", "relationship", "to_ref", "confidence", "evidence_refs"],
      ["from_ref", "relationship", "to_ref", "confidence", "evidence_refs"]);
    if (!entityRefs.has(item.from_ref as string) || !entityRefs.has(item.to_ref as string)) fail("relationship.references_unknown_entity");
    text(item.relationship, "relationship.name", 128);
    numeric(item.confidence, "relationship.confidence", 0, 1);
    const refs = refList(item.evidence_refs, "relationship.evidence_refs", 32);
    if ([...refs].some((entry) => !evidenceRefs.has(entry))) fail("relationship.references_unknown_evidence");
  }

  if (!Array.isArray(world.affordances) || world.affordances.length > MAX_AFFORDANCES) fail("world.affordances_invalid");
  const affordanceIds = new Set<string>();
  for (const raw of world.affordances) {
    const item = object(raw, "world.affordance",
      ["id", "entity_ref", "name", "description", "requires_confirmation"],
      ["id", "entity_ref", "name", "description", "requires_confirmation"]);
    const id = ref(item.id, "affordance.id");
    if (affordanceIds.has(id)) fail("world.affordance_ids_duplicate");
    affordanceIds.add(id);
    if (!entityRefs.has(item.entity_ref as string)) fail("affordance.references_unknown_entity");
    text(item.name, "affordance.name", 128);
    text(item.description, "affordance.description", 1_000);
    if (typeof item.requires_confirmation !== "boolean") fail("affordance.requires_confirmation_must_be_boolean");
  }
  return { revision, entityRefs, evidenceRefs };
}

function validateConstraints(value: unknown): Record<string, unknown> {
  const constraints = object(value, "constraints",
    ["max_observations_per_cycle", "max_observation_items", "max_evidence_bytes", "semantic_only", "verify_each_action"],
    ["max_observations_per_cycle", "max_observation_items", "max_evidence_bytes", "semantic_only", "verify_each_action"]);
  integer(constraints.max_observations_per_cycle, "constraints.max_observations_per_cycle", 1, 1);
  integer(constraints.max_observation_items, "constraints.max_observation_items", 1, MAX_OBSERVATION_ITEMS);
  integer(constraints.max_evidence_bytes, "constraints.max_evidence_bytes", 1_024, 32_768);
  if (constraints.semantic_only !== true) fail("constraints.semantic_only_must_be_true");
  if (constraints.verify_each_action !== true) fail("constraints.verify_each_action_must_be_true");
  return constraints;
}

function validateCapabilities(
  value: unknown,
  entityRefs: Set<string>,
  constraints: Record<string, unknown>,
): { observations: Map<string, Record<string, unknown>>; actions: Map<string, Record<string, unknown>> } {
  const capabilities = object(value, "capabilities", ["observations", "actions"], ["observations", "actions"]);
  if (!Array.isArray(capabilities.observations) || capabilities.observations.length > MAX_CAPABILITIES) fail("capabilities.observations_invalid");
  if (!Array.isArray(capabilities.actions) || capabilities.actions.length > MAX_CAPABILITIES) fail("capabilities.actions_invalid");

  const observations = new Map<string, Record<string, unknown>>();
  for (const raw of capabilities.observations) {
    const item = object(raw, "observation_capability",
      ["id", "description", "target_ref", "input_contract", "max_items", "data_classification", "read_only"],
      ["id", "description", "target_ref", "input_contract", "max_items", "data_classification", "read_only"]);
    const id = ref(item.id, "observation_capability.id");
    if (observations.has(id)) fail("capabilities.observation_ids_duplicate");
    if (typeof item.target_ref !== "string" || !entityRefs.has(item.target_ref)) fail("observation_capability.references_unknown_entity");
    text(item.description, "observation_capability.description", 1_000);
    if (typeof item.input_contract !== "string" || !OBSERVATION_CONTRACTS.has(item.input_contract)) fail("observation_capability.unsupported_input_contract");
    integer(item.max_items, "observation_capability.max_items", 1, MAX_OBSERVATION_ITEMS);
    if ((item.max_items as number) > (constraints.max_observation_items as number)) fail("observation_capability.exceeds_task_budget");
    text(item.data_classification, "observation_capability.data_classification", 64);
    if (item.read_only !== true) fail("observation_capability_must_be_read_only");
    observations.set(id, item);
  }

  const actions = new Map<string, Record<string, unknown>>();
  for (const raw of capabilities.actions) {
    const item = object(raw, "action_capability",
      ["name", "description", "target_ref", "requires_confirmation"],
      ["name", "description", "target_ref", "requires_confirmation"]);
    text(item.name, "action_capability.name", 128);
    const name = item.name as string;
    if (actions.has(name)) fail("capabilities.action_names_duplicate");
    text(item.description, "action_capability.description", 1_000);
    if (item.target_ref !== null && (typeof item.target_ref !== "string" || !entityRefs.has(item.target_ref))) fail("action_capability.references_unknown_entity");
    if (typeof item.requires_confirmation !== "boolean") fail("action_capability.requires_confirmation_must_be_boolean");
    actions.set(name, item);
  }
  return { observations, actions };
}

function validateObservationParameters(
  value: unknown,
  capability: Record<string, unknown>,
  constraints: Record<string, unknown>,
): void {
  const contract = capability.input_contract;
  if (contract === "table_page_v1") {
    const item = object(value, "observation.parameters", ["offset", "limit", "text_query"], ["offset", "limit"]);
    integer(item.offset, "observation.offset", 0, 100_000);
    integer(item.limit, "observation.limit", 1, capability.max_items as number);
    integer(item.limit, "observation.limit", 1, constraints.max_observation_items as number);
    if ("text_query" in item) text(item.text_query, "observation.text_query", 300);
    return;
  }
  if (contract === "entity_inspection_v1") {
    const item = object(value, "observation.parameters", ["fields"], ["fields"]);
    if (!Array.isArray(item.fields) || item.fields.length > 20) fail("observation.fields_invalid");
    item.fields.forEach((field) => text(field, "observation.field", 128));
    if (new Set(item.fields).size !== item.fields.length) fail("observation.fields_duplicate");
    return;
  }
  if (contract === "children_page_v1") {
    const item = object(value, "observation.parameters", ["depth", "offset", "limit"], ["depth", "offset", "limit"]);
    integer(item.depth, "observation.depth", 1, 3);
    integer(item.offset, "observation.offset", 0, 100_000);
    integer(item.limit, "observation.limit", 1, capability.max_items as number);
    integer(item.limit, "observation.limit", 1, constraints.max_observation_items as number);
    return;
  }
  fail("observation.unsupported_input_contract");
}

function validatePostcondition(value: unknown, entityRefs: Set<string>): void {
  const item = object(value, "action.expected_postcondition",
    ["kind", "target_ref", "expected_value", "expected_value_ref", "state", "from_ref", "relationship", "to_ref", "application"],
    ["kind"]);
  if (typeof item.kind !== "string" || !POSTCONDITIONS.has(item.kind)) fail("action.unsupported_postcondition");
  if (["entity_present", "entity_value_equals", "entity_state_equals"].includes(item.kind as string)) {
    const targetRef = ref(item.target_ref, "postcondition.target_ref");
    if (!entityRefs.has(targetRef)) fail("postcondition.references_unknown_entity");
  }
  if (item.kind === "entity_value_equals") {
    const hasValue = Object.prototype.hasOwnProperty.call(item, "expected_value");
    const hasRef = Object.prototype.hasOwnProperty.call(item, "expected_value_ref");
    if (hasValue === hasRef) fail("postcondition.value_or_ref_required");
    if (hasRef) ref(item.expected_value_ref, "postcondition.expected_value_ref");
    else jsonValue(item.expected_value, "postcondition.expected_value");
  }
  if (item.kind === "entity_state_equals") {
    text(item.state, "postcondition.state", 128);
    jsonValue(item.expected_value, "postcondition.expected_value");
  }
  if (item.kind === "relationship_exists") {
    const from = ref(item.from_ref, "postcondition.from_ref");
    const to = ref(item.to_ref, "postcondition.to_ref");
    if (!entityRefs.has(from) || !entityRefs.has(to)) fail("postcondition.references_unknown_entity");
    text(item.relationship, "postcondition.relationship", 128);
  }
  if (item.kind === "application_state_equals") {
    text(item.application, "postcondition.application", 256);
    jsonValue(item.expected_value, "postcondition.expected_value");
  }
}

export function validateAgentTaskV2Payload(value: unknown): asserts value is AgentTaskV2Request {
  const payload = object(value, "request",
    ["version", "task_id", "goal", "intent", "session_id", "task_state", "world", "capabilities", "knowledge", "experience", "constraints", "metadata"],
    ["version", "task_id", "goal", "intent", "session_id", "task_state", "world", "capabilities", "knowledge", "experience", "constraints", "metadata"]);
  if (payload.version !== "2") fail("unsupported_version");
  text(payload.task_id, "task_id", 256);
  text(payload.goal, "goal", 8_000);
  text(payload.intent, "intent", 256);
  text(payload.session_id, "session_id", 256, { nullable: true });
  validateTaskState(payload.task_state);
  const constraints = validateConstraints(payload.constraints);
  const world = validateWorld(payload.world);
  const capabilities = validateCapabilities(payload.capabilities, world.entityRefs, constraints);
  if (capabilities.observations.size > (constraints.max_observations_per_cycle as number)) fail("capabilities.too_many_observations_for_cycle");
  if (payload.knowledge !== null) {
    object(payload.knowledge, "knowledge");
    jsonValue(payload.knowledge, "knowledge");
  }
  if (!Array.isArray(payload.experience) || payload.experience.length > MAX_EXPERIENCE_ITEMS) fail("experience_invalid");
  payload.experience.forEach((item) => {
    object(item, "experience_item");
    jsonValue(item, "experience_item");
  });
  object(payload.metadata, "metadata");
  jsonValue(payload.metadata, "metadata");

  let bodySize: number;
  try {
    bodySize = Buffer.byteLength(JSON.stringify(payload), "utf8");
  } catch {
    fail("request_not_serializable");
  }
  if (bodySize! > MAX_BODY_BYTES) fail("request_body_too_large");
}

export function validateAgentTaskV2Response(
  candidate: unknown,
  request: AgentTaskV2Request,
): asserts candidate is AgentTaskV2Response {
  validateAgentTaskV2Payload(request);
  const response = object(candidate, "response",
    ["version", "task_id", "decision", "rationale", "confidence", "observation_request", "action", "completion", "requires_manual_review"],
    ["version", "task_id", "decision", "rationale", "confidence", "observation_request", "action", "completion", "requires_manual_review"]);
  if (response.version !== "2" || response.version !== request.version) fail("response_version_mismatch");
  if (response.task_id !== request.task_id) fail("response_task_id_mismatch");
  if (!["observe", "act", "done", "manual_review"].includes(String(response.decision))) fail("unsupported_decision");
  text(response.rationale, "response.rationale", 2_000);
  numeric(response.confidence, "response.confidence", 0, 1);
  if (typeof response.requires_manual_review !== "boolean") fail("response.requires_manual_review_must_be_boolean");

  const world = validateWorld(request.world);
  const constraints = request.constraints as unknown as Record<string, unknown>;
  const capabilities = validateCapabilities(request.capabilities, world.entityRefs, constraints);
  const observationRequest = response.observation_request;
  const action = response.action;
  const completion = response.completion;

  if (response.decision === "observe") {
    if (action !== null || completion !== null) fail("observe_has_incompatible_payload");
    if (response.requires_manual_review) fail("observe_cannot_require_manual_review");
    const item = object(observationRequest, "observation_request",
      ["capability_id", "target_ref", "parameters", "based_on_world_revision"],
      ["capability_id", "target_ref", "parameters", "based_on_world_revision"]);
    const capabilityId = ref(item.capability_id, "observation.capability_id");
    const capability = capabilities.observations.get(capabilityId);
    if (!capability) fail("observation_capability_not_exposed");
    if (item.target_ref !== capability.target_ref) fail("observation_target_mismatch");
    integer(item.based_on_world_revision, "observation.world_revision", world.revision, world.revision);
    validateObservationParameters(item.parameters, capability, constraints);
    return;
  }

  if (response.decision === "act") {
    if (observationRequest !== null || completion !== null) fail("act_has_incompatible_payload");
    if (response.requires_manual_review) fail("act_cannot_require_manual_review");
    const item = object(action, "action",
      ["name", "target_ref", "value", "expected_postcondition", "requires_confirmation"],
      ["name", "target_ref", "value", "expected_postcondition", "requires_confirmation"]);
    text(item.name, "action.name", 128);
    const capability = capabilities.actions.get(item.name as string);
    if (!capability) fail("action_not_exposed");
    let targetRef: string | null = null;
    if (item.target_ref !== null) {
      targetRef = ref(item.target_ref, "action.target_ref");
      if (!world.entityRefs.has(targetRef)) fail("action.references_unknown_entity");
    }
    if (capability.target_ref !== targetRef) fail("action_target_mismatch");
    text(item.value, "action.value", 2_000, { nullable: true, nonempty: false });
    if (typeof item.requires_confirmation !== "boolean") fail("action.requires_confirmation_must_be_boolean");
    if (capability.requires_confirmation === true && item.requires_confirmation !== true) fail("action_confirmation_cannot_be_downgraded");
    validatePostcondition(item.expected_postcondition, world.entityRefs);
    return;
  }

  if (response.decision === "done") {
    if (observationRequest !== null || action !== null || completion === null) fail("done_has_incompatible_payload");
    if (response.requires_manual_review) fail("done_cannot_require_manual_review");
    const item = object(completion, "completion", ["evidence_refs"], ["evidence_refs"]);
    const refs = refList(item.evidence_refs, "completion.evidence_refs", 32);
    if (!refs.size) fail("done_requires_evidence");
    if ([...refs].some((entry) => !world.evidenceRefs.has(entry))) fail("done_references_unknown_evidence");
    return;
  }

  if (observationRequest !== null || action !== null || completion !== null) fail("manual_review_has_incompatible_payload");
  if (response.requires_manual_review !== true) fail("manual_review_flag_required");
}

export function invalidAgentTaskV2Response(request: AgentTaskV2Request): AgentTaskV2Response {
  return {
    version: "2",
    task_id: request.task_id,
    decision: "manual_review",
    rationale: "The V2 reasoning response did not satisfy the validated decision contract.",
    confidence: 0,
    observation_request: null,
    action: null,
    completion: null,
    requires_manual_review: true,
  };
}
