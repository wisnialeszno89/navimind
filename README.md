# NaviMind - Clean Build

This is a minimal clean scaffold for the NaviMind chat app (Next.js).
Files included: API chat + pdf, minimal chat UI, store, modes.

Instructions:
1. Set environment variable GROQ_API_KEY in Vercel or .env.local locally.
2. Run `npm install` then `npm run dev`.
3. If you want full PDF parsing, install `pdf-parse` and update /app/api/pdf/route.ts.

## Universal desktop agent bridge

NaviMind can act as the reasoning/context side of the desktop agent. The
local `wh-ai-parser` runtime remains responsible for perception, semantic
action validation, physical execution and verification.

The bridge endpoint is:

- `POST /api/agent/task`
- request: versioned semantic task/world contract
- response: at most one semantic action, `done`, or `manual_review`

Optional environment variables:

- `OPENAI_API_KEY` — model access
- `NAVIMIND_AGENT_MODEL` — reasoning model (defaults to `gpt-4.1-mini`)
- `NAVIMIND_AGENT_SECRET` — shared secret for the desktop-agent request header
  `x-navimind-agent-secret`

Example local flow:

1. Start NaviMind with `npm run dev`.
2. Configure `NAVIMIND_AGENT_URL=http://localhost:3000/api/agent/task` in the
   desktop agent environment.
3. The desktop agent sends its current semantic world and goal to NaviMind.
4. NaviMind returns one semantic action; the desktop agent validates, executes,
   verifies, and observes again.

Coordinates, window handles and provider/runtime identifiers are intentionally
kept inside the desktop runtime and are not part of the bridge contract.

## Structured knowledge context

The desktop-agent bridge accepts a versioned `knowledge` envelope with:

- `local` — application/runtime knowledge supplied by the desktop agent
- `external` — provenance-aware facts and sources for future research results

External knowledge includes confidence, relevance, provenance, conflicts and
limitations. It is treated as untrusted model context, not as an execution
instruction channel. Invalid knowledge is rejected before model reasoning and
fails closed to `manual_review`.

The current stage defines and validates the contract only. Web research is not
enabled yet.

## External research

When the desktop task contains `constraints.research_enabled=true`, NaviMind may
decide that fresh external evidence is required before final semantic reasoning.
The current provider is Tavily Search.

Server-side environment:

```text
TAVILY_API_KEY=...
NAVIMIND_AGENT_RESEARCH_MODEL=gpt-4.1-mini
NAVIMIND_RESEARCH_MAX_RESULTS=5
NAVIMIND_RESEARCH_DEPTH=basic
NAVIMIND_RESEARCH_TIMEOUT_MS=15000
```

Retrieved web content is represented as `retrieved_evidence`, with source URLs
and provider relevance kept separately from epistemic confidence. Search content
is never treated as an execution instruction.

## Secure bridge hardening

See [the hardening requirements](docs/UNIVERSAL_AGENT_BRIDGE_HARDENING.md)
and track work in issues #17–#19.

**Production requirement:** configure `NAVIMIND_AGENT_SECRET` on the server and
in the local desktop runtime. The production endpoint must reject requests if
the secret is missing or invalid. The current route must be hardened before
being treated as production-ready. The desktop connects to the host over
outbound HTTPS; no inbound PC port or tunnel is needed.
