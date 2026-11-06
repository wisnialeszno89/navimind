# Visual agent endpoint — isolated pilot

New endpoint: `POST /api/agent/visual-task`. The existing semantic `/api/agent/task` is unchanged. This code is prepared for review in a draft PR. It has not been merged or manually deployed.

`NAVIMIND_VISUAL_ENABLED=1` is required; without it the route is disabled. Authentication reuses `NAVIMIND_AGENT_SECRET`. Provider configuration reuses server-side `OPENAI_API_KEY`. Optional `NAVIMIND_VISUAL_MODEL` selects an image-capable model with structured outputs; the fallback is the existing V2 model, then `gpt-4.1-mini`.

Protocol `visual-1` accepts one bounded PNG screenshot plus a goal and up to six brief action outcomes. No remote image URLs are fetched. Body limit: 3 MiB; decoded image limit: 2 MiB; screenshot limit: 1600×1200. PNG header dimensions must match declared dimensions.

The server places the PNG in an OpenAI `image_url` content part and requests one typed action. It validates all coordinates, keys and unused fields before returning. `store:false` is set on the API request. No screenshots, requests, secrets or provider error bodies are logged. This is not a guarantee of zero provider-side retention; provider data policies still apply.

The local driver owns execution scope and completion verification. The endpoint alone cannot operate a user's computer. The first client runner is restricted to a disposable local test form with fake data; do not expose it as completed WindowHub automation.

## Checks

```sh
npm install --ignore-scripts --package-lock=false
node --test tests/visual-task-route.test.cjs tests/agent-task-route.test.cjs
./node_modules/.bin/tsc --noEmit --incremental false
```

39 Node tests passed and TypeScript checked successfully. Python-to-HTTP-to-TypeScript-to-image-content integration is exercised by the client repository's `tests/test_visual_http_integration.py`, with this checkout adjacent and npm dependencies installed. It uses `tests/visual-task-local-server.cjs`, binds loopback only, and substitutes the model provider. It does not call OpenAI.

Before live testing: review the patch and deployment target, approve publishing/deploying, configure the new endpoint, then perform one explicit image reasoning test. No production environment variables were changed during preparation.
