const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const MAX_BODY_BYTES = 256 * 1024;
const routePath = path.resolve(__dirname, "../app/api/agent/task/route.ts");

function validTask(overrides = {}) {
  return {
    version: "1",
    task_id: "synthetic-task-1",
    goal: "Inspect the current synthetic test state",
    intent: "test",
    session_id: null,
    user_id: null,
    capability: null,
    skill: null,
    world: {
      active_application: "Synthetic App",
      active_window_title: "Synthetic Window",
      visible_elements: [
        {
          kind: "button",
          label: "Continue",
          interaction_capability: "click",
          current_value: "Ready",
          confidence: 0.9,
        },
      ],
      element_count: 1,
      metadata: {},
    },
    offer_workflow: null,
    knowledge: {
      version: "1",
      local: null,
      external: {
        sources: [],
        facts: [],
        conflicts: [],
        limitations: [],
      },
    },
    experience: [],
    constraints: {
      semantic_only: true,
      max_actions: 3,
      verify_each_action: true,
      allowed_actions: ["click_screen_element"],
    },
    metadata: {},
    ...overrides,
  };
}

function loadV2ContractModule() {
  const contractPath = path.resolve(__dirname, "../app/lib/agent/agentTaskContractV2.ts");
  const source = fs.readFileSync(contractPath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const contractModule = new Module(contractPath, module);
  contractModule.filename = contractPath;
  contractModule.paths = Module._nodeModulePaths(path.dirname(contractPath));
  contractModule._compile(compiled, contractPath);
  return contractModule.exports;
}

const v2Contract = loadV2ContractModule();

function validTaskV2(overrides = {}) {
  const evidence = {
    ref: "ev_0001",
    source: "uia",
    observed_at: "2026-11-02T09:00:00Z",
    world_revision: 7,
    scope: "Table structure",
    confidence: 0.99,
    content: { kind: "grid_structure", row_count: 8, column_count: 4 },
    limitations: [],
  };
  return {
    version: "2",
    task_id: "synthetic-v2-task",
    goal: "Inspect the visible lookup table structure",
    intent: "computer_use",
    session_id: "synthetic-session",
    task_state: { cycle: 0, max_cycles: 30, reasoning_calls_remaining: 5 },
    world: {
      revision: 7,
      observed_at: "2026-11-02T09:00:00Z",
      application: "WindowHub",
      window_title: "Nowa oferta",
      entities: [{
        ref: "ent_0001",
        type: "table",
        label: "Tabela",
        state: { visible: true, enabled: true },
        attributes: [],
        confidence: 0.99,
        evidence_refs: ["ev_0001"],
      }],
      relationships: [],
      affordances: [],
      evidence: [evidence],
    },
    capabilities: {
      observations: [{
        id: "cap_grid_structure",
        description: "Inspect bounded table structure",
        target_ref: "ent_0001",
        input_contract: "table_page_v1",
        max_items: 10,
        data_classification: "ui_structure",
        read_only: true,
      }],
      actions: [],
    },
    knowledge: null,
    experience: [],
    constraints: {
      max_observations_per_cycle: 1,
      max_observation_items: 10,
      max_evidence_bytes: 2048,
      semantic_only: true,
      verify_each_action: true,
    },
    metadata: {},
    ...overrides,
  };
}

function validObserveDecision(task = validTaskV2()) {
  return {
    version: "2",
    task_id: task.task_id,
    decision: "observe",
    rationale: "The table structure is the next missing evidence.",
    confidence: 0.9,
    observation_request: {
      capability_id: "cap_grid_structure",
      target_ref: "ent_0001",
      parameters: { offset: 0, limit: 10 },
      based_on_world_revision: 7,
    },
    action: null,
    completion: null,
    requires_manual_review: false,
  };
}

function loadPost({ nodeEnv = "test", secret, bypass, openaiApiKey = "synthetic-test-openai-key" } = {}) {
  const keys = [
    "NODE_ENV",
    "NAVIMIND_AGENT_SECRET",
    "NAVIMIND_AGENT_ALLOW_DEV_BYPASS",
    "OPENAI_API_KEY",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]])
  );

  if (nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = nodeEnv;
  if (secret === undefined) delete process.env.NAVIMIND_AGENT_SECRET;
  else process.env.NAVIMIND_AGENT_SECRET = secret;
  if (bypass === undefined) delete process.env.NAVIMIND_AGENT_ALLOW_DEV_BYPASS;
  else process.env.NAVIMIND_AGENT_ALLOW_DEV_BYPASS = bypass;
  if (typeof openaiApiKey === "string") process.env.OPENAI_API_KEY = openaiApiKey;
  else delete process.env.OPENAI_API_KEY;

  const calls = [];
  const v2Calls = [];
  let v2Result = null;
  const semanticResult = {
    version: "1",
    task_id: "synthetic-task-1",
    status: "continue",
    rationale: "Synthetic test result only",
    confidence: 0.9,
    action: {
      name: "click_screen_element",
      description: "Click a synthetic visible button",
      target: "Continue",
      value: null,
    },
    requires_manual_review: false,
  };

  const source = fs.readFileSync(routePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const routeModule = new Module(routePath, module);
  routeModule.filename = routePath;
  routeModule.paths = Module._nodeModulePaths(path.dirname(routePath));
  const nativeRequire = routeModule.require.bind(routeModule);
  routeModule.require = (id) => {
    if (id === "next/server") {
      return {
        NextResponse: {
          json(body, init = {}) {
            return new Response(JSON.stringify(body), {
              status: init.status ?? 200,
              headers: { "content-type": "application/json" },
            });
          },
        },
      };
    }
    if (id === "@/lib/agent/agentTaskContractV2") {
      return v2Contract;
    }
    if (id === "@/lib/agent/reasonAgentTaskV2") {
      return {
        reasonAgentTaskV2: async (task) => {
          v2Calls.push(task);
          return v2Result || validObserveDecision(task);
        },
      };
    }
    if (id === "@/lib/agent/reasonAgentTask") {
      return {
        reasonAgentTask: async (task) => {
          calls.push(task);
          return semanticResult;
        },
      };
    }
    return nativeRequire(id);
  };
  routeModule._compile(compiled, routePath);

  return {
    post: routeModule.exports.POST,
    calls,
    v2Calls,
    semanticResult,
    setV2Result(value) { v2Result = value; },
    restore() {
      for (const key of keys) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    },
  };
}

function request(body, { secret = "test-secret", contentType = "application/json", headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  if (contentType !== null) requestHeaders.set("content-type", contentType);
  if (secret !== null) requestHeaders.set("x-navimind-agent-secret", secret);
  return new Request("http://localhost/api/agent/task", {
    method: "POST",
    headers: requestHeaders,
    body,
  });
}

async function withRoute(options, run) {
  const route = loadPost(options);
  try {
    await run(route);
  } finally {
    route.restore();
  }
}

test("production without a configured secret fails closed before reasoning", async () => {
  await withRoute({ nodeEnv: "production", secret: undefined }, async ({ post, calls }) => {
    const response = await post(request(JSON.stringify(validTask()), { secret: null }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "AGENT_AUTH_NOT_CONFIGURED" });
    assert.equal(calls.length, 0);
  });
});

test("development bypass works only with explicit non-production opt-in", async () => {
  await withRoute({ nodeEnv: "test", secret: undefined, bypass: "1" }, async ({ post, calls, semanticResult }) => {
    const response = await post(request(JSON.stringify(validTask()), { secret: null }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), semanticResult);
    assert.equal(calls.length, 1);
  });
});

test("development bypass remains disabled unless explicitly enabled", async () => {
  await withRoute({ nodeEnv: "test", secret: undefined, bypass: undefined }, async ({ post, calls }) => {
    const response = await post(request(JSON.stringify(validTask()), { secret: null }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "AGENT_AUTH_NOT_CONFIGURED" });
    assert.equal(calls.length, 0);
  });
});

test("missing and incorrect secrets are rejected", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls }) => {
    const missing = await post(request(JSON.stringify(validTask()), { secret: null }));
    const incorrect = await post(request(JSON.stringify(validTask()), { secret: "wrong-secret" }));
    assert.equal(missing.status, 401);
    assert.equal(incorrect.status, 401);
    assert.equal(calls.length, 0);
  });
});

test("correct secret accepts a realistic contract and returns semantic reasoning only", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls, semanticResult }) => {
    const response = await post(request(JSON.stringify(validTask())));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), semanticResult);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].task_id, "synthetic-task-1");
  });
});

test("structured WindowHub table metadata is preserved for reasoning", async () => {
  const table = {
    source: "windowhub_ocr_table_reconstruction",
    status: "partial",
    row_count: 2,
    complete_row_count: 1,
    rows: [
      {
        row_index: 1,
        lp: 1,
        lp_source: "ocr_column",
        quantity: 1,
        article: "Okno",
        total_value: "826.29",
        unit_value: "826.29",
        dimensions: "800 x 1220",
        complete: true,
        missing_fields: [],
      },
      {
        row_index: 2,
        lp: null,
        lp_source: "missing",
        quantity: null,
        article: "Okno",
        total_value: "2275.50",
        unit_value: "2275.50",
        dimensions: "800 x 1190",
        complete: false,
        missing_fields: ["lp", "quantity"],
      },
    ],
  };
  const world = {
    ...validTask().world,
    metadata: { windowhub_ocr_table: table },
  };

  await withRoute(
    { nodeEnv: "production", secret: "test-secret" },
    async ({ post, calls }) => {
      const response = await post(request(JSON.stringify(validTask({ world }))));
      assert.equal(response.status, 200);
      assert.equal(calls.length, 1);
      assert.deepEqual(
        calls[0].world.metadata.windowhub_ocr_table,
        table,
      );
    },
  );
});

test("malformed WindowHub OCR table metadata is rejected before reasoning", async () => {
  const completeRow = {
    row_index: 1,
    lp: 1,
    lp_source: "ocr_column",
    quantity: 1,
    article: "Okno",
    total_value: "826.29",
    unit_value: "826.29",
    dimensions: "800 x 1220",
    complete: true,
    missing_fields: [],
  };
  const partialRow = {
    row_index: 2,
    lp: null,
    lp_source: "missing",
    quantity: null,
    article: "Okno",
    total_value: "2275.50",
    unit_value: "2275.50",
    dimensions: "800 x 1190",
    complete: false,
    missing_fields: ["lp", "quantity"],
  };
  const validTable = {
    source: "windowhub_ocr_table_reconstruction",
    status: "partial",
    row_count: 2,
    complete_row_count: 1,
    rows: [completeRow, partialRow],
    field_refinements: [],
    lp_refinements: [],
    limitations: [],
  };
  const invalidTables = [
    { ...validTable, row_count: 1 },
    { ...validTable, complete_row_count: 2 },
    { ...validTable, status: "complete" },
    {
      ...validTable,
      rows: [{ ...partialRow, missing_fields: ["unknown_field"] }, completeRow],
    },
    {
      ...validTable,
      rows: [{ ...completeRow, complete: false, missing_fields: ["quantity"] }, partialRow],
    },
  ];

  await withRoute(
    { nodeEnv: "production", secret: "test-secret" },
    async ({ post, calls }) => {
      for (const table of invalidTables) {
        const world = {
          ...validTask().world,
          metadata: { windowhub_ocr_table: table },
        };
        const response = await post(request(JSON.stringify(validTask({ world }))));
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: "INVALID_AGENT_TASK" });
      }
      assert.equal(calls.length, 0);
    },
  );
});

test("legacy task without world metadata remains accepted", async () => {
  const task = validTask();
  delete task.world.metadata;

  await withRoute(
    { nodeEnv: "production", secret: "test-secret" },
    async ({ post, calls }) => {
      const response = await post(request(JSON.stringify(task)));
      assert.equal(response.status, 200);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].world.metadata, undefined);
    },
  );
});

test("wrong content type is rejected before reasoning", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls }) => {
    const response = await post(request(JSON.stringify(validTask()), { contentType: "text/plain" }));
    assert.equal(response.status, 415);
    assert.deepEqual(await response.json(), { error: "UNSUPPORTED_CONTENT_TYPE" });
    assert.equal(calls.length, 0);
  });
});

test("invalid JSON, missing fields, and unsupported versions return 400", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls }) => {
    const invalidJson = await post(request("{"));
    const missingFields = await post(request(JSON.stringify({ goal: "test", task_id: "x", world: {} })));
    const unsupportedVersion = await post(request(JSON.stringify(validTask({ version: "3" }))));
    const malformedV2 = await post(request(JSON.stringify(validTask({ version: "2" }))));
    for (const response of [invalidJson, missingFields, unsupportedVersion]) {
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "INVALID_AGENT_TASK" });
    }
    assert.equal(malformedV2.status, 400);
    assert.deepEqual(await malformedV2.json(), { error: "INVALID_AGENT_TASK_V2" });

    for (const field of [
      "session_id",
      "user_id",
      "capability",
      "skill",
      "knowledge",
      "experience",
      "offer_workflow",
      "metadata",
    ]) {
      const task = validTask();
      delete task[field];
      const response = await post(request(JSON.stringify(task)));
      assert.equal(response.status, 400, `missing required field: ${field}`);
    }
    assert.equal(calls.length, 0);
  });
});

test("invalid visible elements and confidence are rejected", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls }) => {
    const wrongElements = validTask({
      world: { ...validTask().world, visible_elements: {} },
    });
    const wrongConfidence = validTask({
      world: {
        ...validTask().world,
        visible_elements: [{ kind: "button", label: "Continue", interaction_capability: "click", confidence: 2 }],
      },
    });
    const wrongWorldMetadata = [
      null,
      [],
      "not-an-object",
    ].map((metadata) => validTask({
      world: { ...validTask().world, metadata },
    }));
    for (const task of [wrongElements, wrongConfidence, ...wrongWorldMetadata]) {
      const response = await post(request(JSON.stringify(task)));
      assert.equal(response.status, 400);
    }
    assert.equal(calls.length, 0);
  });
});

test("over-limit task text, visible elements, action budgets, and knowledge lists are rejected", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls }) => {
    const tooManyElements = validTask({
      world: {
        ...validTask().world,
        visible_elements: Array.from({ length: 501 }, (_, index) => ({
          kind: "button",
          label: "Synthetic " + index,
          interaction_capability: "click",
        })),
        element_count: 501,
      },
    });
    const tooLongGoal = validTask({ goal: "x".repeat(8001) });
    const invalidBudget = validTask({
      constraints: { ...validTask().constraints, max_actions: 101 },
    });
    const badKnowledgeVersion = validTask({
      knowledge: { version: "2", local: null, external: null },
    });
    const overLimitKnowledgeLists = [
      ["sources", 33],
      ["facts", 33],
      ["conflicts", 17],
      ["limitations", 17],
    ].map(([key, count]) => {
      const external = {
        sources: [],
        facts: [],
        conflicts: [],
        limitations: [],
      };
      external[key] = Array.from({ length: count }, () => ({}));
      return validTask({
        knowledge: { version: "1", local: null, external },
      });
    });

    for (const task of [
      tooManyElements,
      tooLongGoal,
      invalidBudget,
      badKnowledgeVersion,
      ...overLimitKnowledgeLists,
    ]) {
      const response = await post(request(JSON.stringify(task)));
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "INVALID_AGENT_TASK" });
    }
    assert.equal(calls.length, 0);
  });
});

test("oversized content-length is rejected with 413", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls }) => {
    const response = await post(request("{}", {
      headers: { "content-length": String(MAX_BODY_BYTES + 1) },
    }));
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: "PAYLOAD_TOO_LARGE" });
    assert.equal(calls.length, 0);
  });
});

test("oversized streamed body is cancelled and rejected with 413", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls }) => {
    let cancelled = false;
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_BODY_BYTES + 1));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fakeRequest = {
      headers: new Headers({
        "content-type": "application/json",
        "x-navimind-agent-secret": "test-secret",
      }),
      body,
    };
    const response = await post(fakeRequest);
    assert.equal(response.status, 413);
    assert.equal(cancelled, true);
    assert.equal(calls.length, 0);
  });
});

test("invalid knowledge envelope and action allowlist are rejected", async () => {
  await withRoute({ nodeEnv: "production", secret: "test-secret" }, async ({ post, calls }) => {
    const tooManySources = validTask({
      knowledge: {
        version: "1",
        local: null,
        external: {
          sources: Array.from({ length: 33 }, () => ({})),
          facts: [],
          conflicts: [],
          limitations: [],
        },
      },
    });
    const emptyAllowlist = validTask({
      constraints: { ...validTask().constraints, allowed_actions: [] },
    });
    for (const task of [tooManySources, emptyAllowlist]) {
      const response = await post(request(JSON.stringify(task)));
      assert.equal(response.status, 400);
    }
    assert.equal(calls.length, 0);
  });
});

test("authenticated requests fail clearly when the model provider is not configured", async () => {
  await withRoute(
    { nodeEnv: "production", secret: "test-secret", openaiApiKey: "" },
    async ({ post, calls }) => {
      const response = await post(request(JSON.stringify(validTask())));
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "AGENT_PROVIDER_NOT_CONFIGURED" });
      assert.equal(calls.length, 0);
    },
  );
});

test("unknown provider actions become manual review instead of an executable proposal", async () => {
  await withRoute(
    { nodeEnv: "test", secret: "test-secret" },
    async ({ post, semanticResult }) => {
      semanticResult.action.name = "delete_file";
      const response = await post(request(JSON.stringify(validTask())));
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.status, "manual_review");
      assert.equal(payload.action, null);
      assert.equal(payload.requires_manual_review, true);
      assert.equal(payload.metadata.error, "INVALID_AGENT_TASK_RESPONSE");
    },
  );
});

test("reasoning response task IDs and completion/action invariants are enforced", async () => {
  await withRoute(
    { nodeEnv: "test", secret: "test-secret" },
    async ({ post, semanticResult }) => {
      semanticResult.task_id = "different-task";
      const response = await post(request(JSON.stringify(validTask())));
      const payload = await response.json();
      assert.equal(payload.status, "manual_review");
      assert.equal(payload.action, null);
      assert.equal(payload.requires_manual_review, true);
    },
  );
});

test("provider failures return a generic error and do not log exception contents", async () => {
  const route = loadPost({ nodeEnv: "production", secret: "test-secret" });
  const oldError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args);
  route.restore();
  process.env.NODE_ENV = "production";
  process.env.NAVIMIND_AGENT_SECRET = "test-secret";
  process.env.OPENAI_API_KEY = "synthetic-test-openai-key";

  try {
    const source = fs.readFileSync(routePath, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const throwingModule = new Module(routePath, module);
    throwingModule.filename = routePath;
    throwingModule.paths = Module._nodeModulePaths(path.dirname(routePath));
    const nativeRequire = throwingModule.require.bind(throwingModule);
    throwingModule.require = (id) => {
      if (id === "next/server") {
        return { NextResponse: { json(body, init = {}) { return new Response(JSON.stringify(body), { status: init.status ?? 200 }); } } };
      }
      if (id === "@/lib/agent/reasonAgentTask") {
        return { reasonAgentTask: async () => { throw new Error("synthetic-secret-and-document-content"); } };
      }
      return nativeRequire(id);
    };
    throwingModule._compile(compiled, routePath);

    const response = await throwingModule.exports.POST(request(JSON.stringify(validTask())));
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "AGENT_TASK_FAILED" });
    assert.deepEqual(logged, [["NAVIMIND_AGENT_TASK_ERROR"]]);
    assert.equal(JSON.stringify(logged).includes("synthetic-secret-and-document-content"), false);
  } finally {
    console.error = oldError;
    route.restore();
  }
});


test("V2 payload validator accepts the local runtime contract fixture", () => {
  const task = validTaskV2();
  assert.doesNotThrow(() => v2Contract.validateAgentTaskV2Payload(task));
});

test("V2 request validator rejects unknown fields and provider-native identifiers", () => {
  const extraField = validTaskV2();
  extraField.untrusted_extra = true;

  const providerIdentifier = validTaskV2();
  providerIdentifier.world.evidence[0].content.runtime_id = [1, 2, 3];

  const badCapability = validTaskV2();
  badCapability.capabilities.observations[0].input_contract = "arbitrary_query_v1";

  const notReadOnly = validTaskV2();
  notReadOnly.capabilities.observations[0].read_only = false;

  for (const task of [extraField, providerIdentifier, badCapability, notReadOnly]) {
    assert.throws(() => v2Contract.validateAgentTaskV2Payload(task));
  }
});

test("V2 request validator rejects references outside the current world", () => {
  const task = validTaskV2();
  task.capabilities.observations[0].target_ref = "ent_not_in_world";
  assert.throws(() => v2Contract.validateAgentTaskV2Payload(task));
});

test("V2 request validator enforces observation and body budgets", () => {
  const tooManyItems = validTaskV2();
  tooManyItems.capabilities.observations[0].max_items = 11;
  assert.throws(() => v2Contract.validateAgentTaskV2Payload(tooManyItems));

  const invalidTaskState = validTaskV2();
  invalidTaskState.task_state.cycle = 31;
  assert.throws(() => v2Contract.validateAgentTaskV2Payload(invalidTaskState));

  const oversized = validTaskV2({ goal: "x".repeat(8_001) });
  assert.throws(() => v2Contract.validateAgentTaskV2Payload(oversized));
});

test("V2 observe decision accepts only an exposed capability, exact target and current revision", () => {
  const task = validTaskV2();
  assert.doesNotThrow(() =>
    v2Contract.validateAgentTaskV2Response(validObserveDecision(task), task)
  );

  const unknownCapability = validObserveDecision(task);
  unknownCapability.observation_request.capability_id = "cap_not_exposed";
  assert.throws(() =>
    v2Contract.validateAgentTaskV2Response(unknownCapability, task)
  );

  const wrongTarget = validObserveDecision(task);
  wrongTarget.observation_request.target_ref = "ent_other";
  assert.throws(() =>
    v2Contract.validateAgentTaskV2Response(wrongTarget, task)
  );

  const staleRevision = validObserveDecision(task);
  staleRevision.observation_request.based_on_world_revision = 6;
  assert.throws(() =>
    v2Contract.validateAgentTaskV2Response(staleRevision, task)
  );

  const excessiveLimit = validObserveDecision(task);
  excessiveLimit.observation_request.parameters.limit = 11;
  assert.throws(() =>
    v2Contract.validateAgentTaskV2Response(excessiveLimit, task)
  );
});

test("V2 action decision requires an action capability and a typed postcondition", () => {
  const task = validTaskV2();
  task.capabilities.actions = [{
    name: "activate_tab",
    description: "Activate the selected tab",
    target_ref: "ent_0001",
    requires_confirmation: true,
  }];
  const response = {
    version: "2",
    task_id: task.task_id,
    decision: "act",
    rationale: "The local runtime exposed this action.",
    confidence: 0.9,
    observation_request: null,
    action: {
      name: "activate_tab",
      target_ref: "ent_0001",
      value: null,
      expected_postcondition: {
        kind: "entity_state_equals",
        target_ref: "ent_0001",
        state: "active",
        expected_value: true,
      },
      requires_confirmation: true,
    },
    completion: null,
    requires_manual_review: false,
  };
  assert.doesNotThrow(() => v2Contract.validateAgentTaskV2Response(response, task));

  const unexposed = JSON.parse(JSON.stringify(response));
  unexposed.action.name = "delete_file";
  assert.throws(() => v2Contract.validateAgentTaskV2Response(unexposed, task));

  const downgraded = JSON.parse(JSON.stringify(response));
  downgraded.action.requires_confirmation = false;
  assert.throws(() => v2Contract.validateAgentTaskV2Response(downgraded, task));

  const missingPostcondition = JSON.parse(JSON.stringify(response));
  missingPostcondition.action.expected_postcondition = { kind: "free_form_success" };
  assert.throws(() => v2Contract.validateAgentTaskV2Response(missingPostcondition, task));
});

test("V2 done decision requires evidence from the current request", () => {
  const task = validTaskV2();
  const response = {
    version: "2",
    task_id: task.task_id,
    decision: "done",
    rationale: "The required evidence confirms completion.",
    confidence: 0.95,
    observation_request: null,
    action: null,
    completion: { evidence_refs: ["ev_0001"] },
    requires_manual_review: false,
  };
  assert.doesNotThrow(() => v2Contract.validateAgentTaskV2Response(response, task));

  response.completion.evidence_refs = ["ev_unknown"];
  assert.throws(() => v2Contract.validateAgentTaskV2Response(response, task));
});

test("V2 manual review decision must stop without action or observation payloads", () => {
  const task = validTaskV2();
  const response = {
    version: "2",
    task_id: task.task_id,
    decision: "manual_review",
    rationale: "No approved capability is available.",
    confidence: 0,
    observation_request: null,
    action: null,
    completion: null,
    requires_manual_review: true,
  };
  assert.doesNotThrow(() => v2Contract.validateAgentTaskV2Response(response, task));

  response.requires_manual_review = false;
  assert.throws(() => v2Contract.validateAgentTaskV2Response(response, task));
});

test("V2 route dispatches to the dedicated reasoner and leaves V1 untouched", async () => {
  await withRoute(
    { nodeEnv: "production", secret: "test-secret" },
    async ({ post, calls, v2Calls }) => {
      const v2 = validTaskV2();
      const response = await post(request(JSON.stringify(v2)));
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.version, "2");
      assert.equal(payload.decision, "observe");
      assert.equal(calls.length, 0);
      assert.equal(v2Calls.length, 1);
      assert.equal(v2Calls[0].task_id, v2.task_id);

      const v1 = await post(request(JSON.stringify(validTask())));
      assert.equal(v1.status, 200);
      assert.equal(calls.length, 1);
      assert.equal(v2Calls.length, 1);
    },
  );
});

test("V2 route rejects malformed V2 requests before invoking the reasoner", async () => {
  await withRoute(
    { nodeEnv: "production", secret: "test-secret" },
    async ({ post, v2Calls }) => {
      const task = validTaskV2();
      task.capabilities.observations[0].target_ref = "ent_missing";
      const response = await post(request(JSON.stringify(task)));
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "INVALID_AGENT_TASK_V2" });
      assert.equal(v2Calls.length, 0);
    },
  );
});

test("V2 route converts an invalid model decision to manual review", async () => {
  await withRoute(
    { nodeEnv: "production", secret: "test-secret" },
    async ({ post, setV2Result }) => {
      const invalid = validObserveDecision();
      invalid.observation_request.capability_id = "not_exposed";
      setV2Result(invalid);

      const response = await post(request(JSON.stringify(validTaskV2())));
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.decision, "manual_review");
      assert.equal(payload.observation_request, null);
      assert.equal(payload.action, null);
      assert.equal(payload.completion, null);
      assert.equal(payload.requires_manual_review, true);
    },
  );
});
