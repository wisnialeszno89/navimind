const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function loadTaskHandoff() {
  const filename = path.join(root, "app/lib/chat/agentTaskHandoff.ts");
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled, filename);
  return mod.exports;
}

const { prepareAgentTaskHandoff, isTaskMode } = loadTaskHandoff();

test("explicit agent-task mode produces a portable draft, never an execution claim", () => {
  const draft = prepareAgentTaskHandoff("Przenieś zestawienie do arkusza.", "task");
  assert.equal(draft.schema_version, "1");
  assert.equal(draft.target, "computer");
  assert.equal(draft.goal, "Przenieś zestawienie do arkusza.");
  assert.equal(draft.status, "prepared_not_executed");
  assert.equal(draft.execution, "local_user_approval_required");
  assert.match(draft.id, /^[a-f0-9-]{36}$/);
});

test("clear Polish WindowHub order becomes a task in ordinary conversation", () => {
  for (const goal of [
    "Przygotuj ofertę na okno 1230x1478, kolor antracyt.",
    "Zrób wycenę okien do domu.",
    "Wyceń stolarkę okienną dla klienta.",
  ]) {
    const draft = prepareAgentTaskHandoff(goal, "conversation");
    assert.ok(draft, goal);
    assert.equal(draft.target, "windowhub");
  }
});

test("ordinary questions and support conversations do not silently become tasks", () => {
  for (const text of [
    "Cześć, jak Ci minął dzień?",
    "Jak przygotować ofertę na okno?",
    "Wyjaśnij, jak zrobić ofertę w WindowHub.",
    "Przygotuj plan na weekend.",
  ]) {
    assert.equal(prepareAgentTaskHandoff(text, "conversation"), null, text);
  }
});

test("invalid task input and mode are rejected deterministically", () => {
  assert.equal(isTaskMode("task"), true);
  assert.equal(isTaskMode("conversation"), true);
  assert.equal(isTaskMode("execute"), false);
  assert.equal(prepareAgentTaskHandoff("  ", "task"), null);
  assert.equal(prepareAgentTaskHandoff("x".repeat(4001), "task"), null);
});

test("chat API and UI explicitly represent local task handoff only", () => {
  const route = fs.readFileSync(path.join(root, "app/api/chat/route.ts"), "utf8");
  const composer = fs.readFileSync(path.join(root, "app/components/SendForm.tsx"), "utf8");
  const card = fs.readFileSync(path.join(root, "app/components/AgentTaskHandoffCard.tsx"), "utf8");
  const prompt = fs.readFileSync(path.join(root, "app/lib/chat/buildChatSystemPrompt.ts"), "utf8");
  assert.match(route, /taskHandoff: handoff/);
  assert.match(composer, /interactionMode/);
  assert.match(card, /Pobierz zlecenie TXT/);
  assert.match(card, /navimind-agent-task\.txt/);
  assert.match(prompt, /nie (?:sterował|uruchomiono)|Nie uruchomiono/i);
  assert.doesNotMatch(route, /execute_v2_step|computer_use_live/i);
});
