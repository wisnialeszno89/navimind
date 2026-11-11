const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../app/lib/desktop-connection.ts');
const output = new Module(filename, module);
output.filename = filename;
output.paths = Module._nodeModulePaths(path.dirname(filename));
output._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const {pairingCode, localRequest} = output.exports;
const token = 'synthetic-test-pairing-token-0123456789012345';

test('pairing accepts the bare clipboard code and a labelled terminal line', () => {
  assert.equal(pairingCode(token), token);
  assert.equal(pairingCode('  KOD_PAROWANIA=' + token + ' \r\n'), token);
  assert.equal(pairingCode('KOD_PAROWANIA=\"' + token + '\"'), token);
  assert.equal(pairingCode(token.slice(0,20) + '\u200b\r\n' + token.slice(20)), token);
  assert.throws(() => pairingCode('short'), /odczytano 5 znaków/);
  assert.throws(() => pairingCode(token + '\n' + token));
});
test('connection keeps credentials on loopback and makes auth failures actionable', async () => {
  const previous = global.fetch;
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'http://127.0.0.1:43127/status');
      assert.equal(options.headers.Authorization, 'Bearer ' + token);
      assert.equal(options.credentials, 'omit');
      return new Response(JSON.stringify({status: 'ready'}));
    };
    assert.deepEqual(await localRequest(token, '/status'), {status: 'ready'});
    await assert.rejects(localRequest(token, 'https://external.example'), /Nieprawidłowy adres/);
    global.fetch = async () => new Response('{}', {status: 403});
    await assert.rejects(localRequest(token, '/status'), /najnowszy kod/);
    global.fetch = async () => {throw new TypeError('Failed to fetch');};
    await assert.rejects(localRequest(token, '/status'), /Przeglądarka nie dotarła/);
  } finally {global.fetch = previous;}
});
