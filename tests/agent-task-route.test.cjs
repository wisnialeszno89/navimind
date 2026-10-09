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

function loadPost({ nodeEnv = "test", secret, bypass } = {}) {
  const keys = [
    "NODE_ENV",
    "NAVIMIND_AGENT_SECRET",
    "NAVIMIND_AGENT_ALLOW_DEV_BYPASS",
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

  const calls = [];
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
    semanticResult,
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
    const wrongVersion = await post(request(JSON.stringify(validTask({ version: "2" }))));
    for (const response of [invalidJson, missingFields, wrongVersion]) {
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "INVALID_AGENT_TASK" });
    }

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
    for (const task of [wrongElements, wrongConfidence]) {
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

test("provider failures return a generic error and do not log exception contents", async () => {
  const route = loadPost({ nodeEnv: "production", secret: "test-secret" });
  const oldError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args);
  route.restore();
  process.env.NODE_ENV = "production";
  process.env.NAVIMIND_AGENT_SECRET = "test-secret";

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
