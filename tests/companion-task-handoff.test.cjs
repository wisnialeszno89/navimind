const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("chat prompt keeps task execution separate from desktop bridge", () => {
  const source = fs.readFileSync(path.join(__dirname, "../app/lib/conversation/buildSystemPrompt.ts"), "utf8");
  assert.match(source, /TRYB ROZMOWA \/ ZADANIE/);
  assert.match(source, /zwykła wiadomość w czacie NIE uruchamia fizycznych działań/);
  assert.match(source, /Nie twierdź, że kliknięto, zapisano, wysłano/);
  assert.match(source, /poproś o zatwierdzenie przed działaniem/);
});

test("welcome message supports task and companion intents", () => {
  const source = fs.readFileSync(path.join(__dirname, "../app/lib/welcomeMessages.ts"), "utf8");
  assert.match(source, /pogadać albo zająć się konkretnym zadaniem/);
  assert.match(source, /just talk or work through a specific task/);
});
