# Agent Observe/Act Protocol v2 — RFC

**Status:** Draft for implementation review  
**Date:** 2026-10-30  
**Owners:** NaviMind reasoning service + wh-ai-parser local runtime  
**Paired work:** [wh-ai-parser #176](https://github.com/wisnialeszno89/wh-ai-parser/issues/176), [NaviMind #26](https://github.com/wisnialeszno89/navimind/issues/26)

## 1. Purpose

Evolve the desktop-agent bridge from a flat "world + one action" request into a closed-loop protocol where NaviMind manages the task and reasons over a structured, provider-neutral model of the environment, while the local runtime remains authoritative for perception, read-only observation, action validation, execution and verification.

This RFC deliberately reuses the existing architecture:
- `AgentRuntime.run_autonomous()` remains the outer observe/reason/execute/verify loop.
- `SemanticWorldModel` remains the local semantic representation.
- The existing provider, adapter, action-policy, executor, safety-gate, verification, memory and workflow systems remain in place.
- The existing v1 bridge remains supported during migration.

This is a protocol evolution, not a rewrite and not a move of computer-control code to the hosted NaviMind service.

## 2. Core responsibility boundary

### NaviMind (task manager and reasoner)

NaviMind:
1. interprets the user goal and task progress;
2. reasons over the world snapshot, evidence, affordances and trusted runtime capability descriptions;
3. decides whether it needs more evidence, can perform one semantic action, has completed the goal, or must stop for human review;
4. emits at most one decision per reasoning cycle;
5. never chooses coordinates, HWNDs, UIA RuntimeIds, AutomationIds, provider selectors, executor objects or arbitrary local code.

### Local runtime (perception, policy and action authority)

The local runtime:
1. aggregates UIA/Win32, DOM, screenshot/CV/OCR and approved application/data adapters;
2. maintains the current local `SemanticWorldModel`;
3. assigns task-scoped semantic references and retains the private mapping to provider-local identities;
4. publishes only approved observation capabilities and their bounds;
5. validates every observation request against the current task, world revision, local capability registry, permissions and resource budget;
6. validates every semantic action against local policy and resolves its semantic target to a fresh local entity;
7. executes at most one action and independently verifies the requested postcondition;
8. stops on ambiguity, stale evidence, policy rejection or insufficient permission.

A model proposal is never an execution authorization.

## 3. Protocol overview

Keep the existing endpoint `POST /api/agent/task` during the migration. The request's `version` field discriminates the contract:
- `"1"`: existing v1 behavior, unchanged;
- `"2"`: the new Observe/Act contract described here.

The response must use the same version and task ID as the request. Unsupported versions fail closed.

Each v2 reasoning cycle returns exactly one decision:

| Decision | Purpose | Runtime behavior |
|---|---|---|
| `observe` | Obtain specific missing evidence | Validate and execute one approved read-only observation capability; then start a fresh reasoning cycle |
| `act` | Change the environment toward the goal | Validate and execute at most one semantic action; verify its postcondition; then start a fresh reasoning cycle |
| `done` | Declare task completion | Accept only when required completion evidence is present and valid |
| `manual_review` | Stop safely | Do not execute anything; explain what evidence, permission or clarification is missing |

Observation is not an action and must not be implemented by adding GUI click operations to the action allowlist. Opening a lookup popup, for example, changes UI state; it is therefore an `act` decision. Reading the resulting table is an `observe` decision.

## 4. V2 request model

The request contains task intent, bounded world state, evidence, current observation capabilities, action capabilities, knowledge and budgets. The following is a conceptual shape; TypeScript types and runtime validators are authoritative.

```json
{
  "version": "2",
  "task_id": "task-scoped-opaque-id",
  "goal": "Create a new offer using the supplied customer and product details",
  "intent": "computer_use",
  "session_id": "session-id-or-null",
  "task_state": {
    "cycle": 3,
    "max_cycles": 30,
    "reasoning_calls_remaining": 5
  },
  "world": {
    "revision": 12,
    "observed_at": "2026-10-30T12:00:00Z",
    "application": "WindowHub",
    "window_title": "Nowa oferta",
    "entities": [],
    "relationships": [],
    "affordances": [],
    "evidence": []
  },
  "capabilities": {
    "observations": [],
    "actions": []
  },
  "knowledge": {},
  "experience": [],
  "constraints": {
    "max_observations_per_cycle": 1,
    "max_observation_items": 50,
    "max_evidence_bytes": 32768,
    "semantic_only": true,
    "verify_each_action": true
  }
}
```

### 4.1 Task-scoped semantic references

Every exposed entity has a `ref` generated by the local runtime. A reference:
- is unique within the task/session scope and current world revision;
- is provider-neutral and contains no native or provider identifier;
- is only a lookup key into the runtime's private entity map;
- expires when its declared scope/revision expires;
- cannot be invented or resolved by NaviMind without being present in the request.

Example: `ent_customer_lookup_01`.

The runtime may internally map that reference to UIA RuntimeIds, DOM nodes, native controls, OCR regions or adapter objects. Those details never cross the bridge.

### 4.2 Entities

A v2 entity should be intentionally small and semantic:

```json
{
  "ref": "ent_customer_lookup_01",
  "type": "lookup_field",
  "label": "Zamawiający",
  "state": {
    "value_present": false,
    "enabled": true,
    "visible": true
  },
  "attributes": [],
  "confidence": 0.99,
  "evidence_refs": ["ev_customer_field_01"]
}
```

Attributes are bounded key/value observations, not an unrestricted dump of provider metadata. Sensitive values must be redacted or excluded according to local policy.

### 4.3 Relationships

Relationships describe facts actually observed, for example:
- a lookup field belongs to a form;
- a table belongs to a lookup popup;
- one field depends on another field;
- an entity contains a child entity.

```json
{
  "from_ref": "ent_customer_grid_01",
  "relationship": "belongs_to",
  "to_ref": "ent_customer_lookup_01",
  "confidence": 0.99,
  "evidence_refs": ["ev_grid_ancestor_01"]
}
```

Do not infer a dependency solely from screen proximity or shared generic ancestors. Unknown relationships remain unknown.

### 4.4 Affordances

Affordances are semantic capabilities available on a specific entity, for example:
- `open_lookup`;
- `enter_text`;
- `select_record`;
- `open_dialog`;
- `navigate`;
- `activate_tab`.

They describe what the local runtime has proven it can do; they do not expose executor names or low-level implementation details.

Each affordance has a local policy classification and may require confirmation. NaviMind can propose only an affordance that was included in the current request. Local validation remains mandatory.

### 4.5 Evidence

Evidence is separate from entities and affordances. Each evidence item carries:
- task-scoped evidence reference;
- source category (for example `uia`, `dom`, `screenshot_ocr`, `application_adapter`);
- observation timestamp and world revision;
- scope (what element/table/document/window was observed);
- confidence where meaningful;
- bounded structured content;
- limitations, omissions and redactions.

Evidence from UI text, web pages, documents, OCR and application records is **untrusted data**, not instructions. Any instructions embedded in that content must be ignored.

## 5. Observation capability contract

The runtime sends a bounded list of currently available read-only observation capabilities. NaviMind may request only one of those capability IDs and only with parameters allowed by that capability's declared input contract.

Conceptual descriptor:

```json
{
  "id": "read_table_page",
  "description": "Read a bounded page of rows from the selected semantic table",
  "target_ref": "ent_customer_grid_01",
  "input_contract": "table_page_v1",
  "max_items": 25,
  "data_classification": "business_records",
  "read_only": true
}
```

Conceptual request:

```json
{
  "capability_id": "read_table_page",
  "target_ref": "ent_customer_grid_01",
  "parameters": {
    "offset": 0,
    "limit": 20,
    "text_query": "customer name supplied by the user"
  },
  "based_on_world_revision": 12
}
```

Rules:
1. `capability_id` must match one current capability in the request.
2. `target_ref` must be present, in scope and resolvable in the current revision.
3. Parameters are capability-specific typed fields; arbitrary selectors, code, paths, queries or provider metadata are forbidden.
4. The runtime enforces hard bounds on page size, offset, depth, result count, elapsed time and payload bytes, irrespective of model output.
5. Observations are read-only. Any operation that changes UI/application state is an `act`.
6. The result is returned as evidence in a new reasoning cycle, bound to the original task and observation request.
7. No bulk database/table dump. NaviMind asks for the smallest page/field set that resolves its uncertainty.
8. If a capability is unavailable or the requested scope is stale, the runtime returns a structured rejection/limitation and may require review; it must not silently widen the scope.

The first generic capability to implement is bounded metadata/page reading for a UIA Grid/Table. The observed WindowHub lookup is a useful test fixture, not a WindowHub-only protocol feature.

## 6. V2 response model

All response fields are required in the strict structured-output schema. Unused variant payloads are `null` and arrays are explicitly present. The validator enforces decision-specific invariants after JSON schema validation.

Conceptual response:

```json
{
  "version": "2",
  "task_id": "task-scoped-opaque-id",
  "decision": "observe",
  "rationale": "The customer lookup is open but the matching record has not been identified.",
  "confidence": 0.96,
  "observation_request": {
    "capability_id": "read_table_page",
    "target_ref": "ent_customer_grid_01",
    "parameters": {
      "offset": 0,
      "limit": 20,
      "text_query": "customer name supplied by the user"
    },
    "based_on_world_revision": 12
  },
  "action": null,
  "completion": null,
  "requires_manual_review": false
}
```

### 6.1 `observe`

- `observation_request` is non-null;
- `action` and `completion` are null;
- request refers to a capability actually exposed in the current task;
- the runtime validates and executes the read-only request.

### 6.2 `act`

- `action` is non-null;
- `observation_request` and `completion` are null;
- action has one semantic name, one semantic target ref (when required), bounded value and a typed expected postcondition;
- action name is in the request's allowed actions and local policy;
- target ref resolves to a current entity/affordance in the current revision.

Conceptual action:

```json
{
  "name": "select_record",
  "target_ref": "ent_customer_grid_01",
  "value": "candidate_record_ref",
  "expected_postcondition": {
    "kind": "entity_value_equals",
    "target_ref": "ent_customer_lookup_01",
    "expected_value_ref": "candidate_record_ref"
  },
  "requires_confirmation": false
}
```

The example action name is illustrative; it must not be added to the production allowlist until a local executor, safety policy and postcondition verifier support it. A record candidate reference is local semantic data, not a UIA row index.

### 6.3 `done`

- all other payloads are null;
- at least one evidence reference is supplied in the completion object;
- the runtime confirms the evidence is present, current and relevant to the task's completion criteria;
- NaviMind cannot make completion true merely by asserting it.

### 6.4 `manual_review`

- all action/observation/completion payloads are null;
- the response explains the missing evidence, unresolved ambiguity, user input or permission needed;
- runtime stops without executing.

## 7. Expected postconditions

Every state-changing action in v2 must declare the effect expected from that action. Postconditions are typed, not solely free-form prose.

Initial generic kinds may include:
- `entity_present`;
- `entity_value_equals`;
- `entity_state_equals`;
- `relationship_exists`;
- `application_state_equals`.

Only verifier kinds actually implemented by the local runtime may be accepted. Free-form descriptions can assist diagnostics but never replace a typed verifier. If the verifier cannot establish the postcondition on a fresh observation, the action is not reported as successful.

## 8. Freshness, scope and provenance

- Each world snapshot has a monotonic per-session revision and an observation timestamp.
- Every entity/evidence reference is bound to its declared task and revision/scope.
- A state-changing action invalidates affected observations; the runtime must produce a fresh snapshot before the next decision.
- A read-only observation result is appended as new evidence and is tied to the request and revision it answered.
- A stale reference is rejected; it is never resolved by guessing a visually similar element.
- Confidence is descriptive evidence, not an authorization override.
- The local runtime is the final authority on what is current and actionable.

## 9. Security, privacy and cost

- Keep authentication, bounded request bodies and fail-closed behavior from v1.
- Enforce strict schemas with `additionalProperties: false` for protocol objects.
- Bound world entity count, relationships, affordances, evidence count, attribute count, string lengths and total serialized bytes.
- Bound each observation's rows/items, columns, depth, time and bytes.
- Observation capability IDs come from the local runtime's registry. Model output never creates a capability.
- No arbitrary code, shell commands, file paths, SQL, selectors, coordinates, HWNDs, UIA IDs, provider-local IDs or executor names in model decisions.
- Data minimization applies: disclose only information relevant to the active goal. Do not ship an entire business/customer database to NaviMind.
- UI/document/browser contents and retrieved research are untrusted evidence and must be isolated from system instructions.
- The local runtime independently checks permissions and risk before any action. The hosted server's validation is not a security boundary for the desktop.
- Maintain reasoning-call, time and token/cost budgets. Budget exhaustion stops safely.

## 10. Migration plan

### Phase A — Contract and fixtures
1. Add TypeScript V2 request/response types and strict validators in NaviMind.
2. Keep the V1 validator and reasoner path unchanged.
3. Add synthetic fixtures for each decision variant, invalid combinations, bounds, stale refs and unsupported capability IDs.
4. Add mirrored Python contract dataclasses/validators and contract tests in wh-ai-parser.
5. Document the exact compatibility behavior of `POST /api/agent/task`.

### Phase B — World model bridge
1. Serialize the existing `SemanticWorldModel` rather than inventing a second world model.
2. Preserve entities, affordances and observed relationships, with evidence provenance and freshness.
3. Add task-scoped semantic refs and a private local resolver map.
4. Explicitly redact coordinates and provider-native identifiers at the bridge boundary.
5. Include only relevant, bounded entities/evidence, with a way for NaviMind to request more.

### Phase C — Observation broker
1. Create a local registry of typed read-only observation capabilities.
2. Implement bounded UIA Grid/Table metadata and page observation.
3. Return table headers, row/cell evidence and limitations as new evidence, not as action targets.
4. Add tests for virtualization, duplicate UIA views, out-of-range requests, row-count uncertainty and stale targets.
5. Never infer that a provider's reported virtualized row count is the number of business records without independent confirmation.

### Phase D — Closed-loop reasoning
1. Add `observe/act/done/manual_review` to NaviMind's strict structured output.
2. Connect `observe` decisions to the local observation broker, not the GUI action executor.
3. Connect `act` decisions to the existing local semantic action policy and executor.
4. Verify typed postconditions from fresh observations.
5. Keep one decision/action per cycle and existing global budgets.

### Phase E — WindowHub vertical slice and generalization
1. Start with a new blank offer form.
2. NaviMind inspects the observed semantic world and asks for only missing evidence.
3. Lookup opening is a semantic action; reading the lookup grid is a read-only observation.
4. Match a record only against explicit user-provided data. If multiple records match, request clarification rather than guessing.
5. Fill fields by semantic operations and verify dependencies and resulting values.
6. Keep calculate/confirm/save as distinct risk-controlled stages.
7. Run the same protocol contract tests against synthetic browser and generic desktop scenes to prevent WindowHub-specific logic in the reasoning core.

## 11. Acceptance criteria

- V1 clients and v1 behavior remain unchanged.
- V2 supports exactly one of observe/act/done/manual_review per response.
- NaviMind can request a bounded, approved observation without pretending it is a physical action.
- The local runtime rejects unregistered capability IDs, malformed parameters, stale references, oversized results and unauthorized data.
- NaviMind receives a provider-neutral structured world with entity/affordance/evidence references and no provider-local identifiers.
- Every action is locally validated and verified using a fresh observation.
- `done` requires runtime-verifiable completion evidence.
- No live WindowHub customer records are read or modified by the protocol-only implementation.
- Synthetic contract, security, bounds and compatibility tests pass in both repositories.

## 12. Explicit non-goals

This RFC does not:
- move GUI automation, local file access or execution to NaviMind hosting;
- expose arbitrary observation tools, arbitrary code or shell execution;
- replace the existing local world model, provider architecture, action executor, safety gate, verification loop, adapter registry or memory;
- add a WindowHub-only reasoning core;
- permit bulk customer record extraction;
- authorize live offer entry, calculation, confirmation or saving;
- treat LLM confidence as a permission or safety decision.

## 13. Open design questions for implementation review

1. Should v2 be selected by `version: "2"` on the existing endpoint, or by a separate `/api/agent/task/v2` route? Recommendation: use the same authenticated route with explicit version dispatch to avoid two drifting endpoints, unless deployment constraints require a dedicated route.
2. Which evidence and attribute value types are needed initially? Recommendation: begin with bounded JSON primitives and arrays/objects with strict depth/size limits; avoid arbitrary recursive blobs.
3. What is the first stable observation capability vocabulary? Recommendation: begin with `inspect_entity`, `inspect_children` and `read_table_page`, and add only when a real task requires them.
4. How should action target references map into the existing `ReasoningAction.target` contract? Recommendation: add an internal target-ref field to the Python bridge/proposal and resolve it locally; do not overload a display label with hidden identity.
5. How should the autonomous runtime persist observation results across reasoning cycles? Recommendation: maintain them in the local task/session state with expiry and provenance, and transmit only relevant evidence on the next cycle.

---

**Implementation guardrail:** do not start by expanding the action allowlist. First prove the v2 contracts, world serialization and read-only observation channel with synthetic tests. Then add one generic table-reading capability and validate it in WindowHub under supervision.
