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
- required `constraints.allowed_actions` allowlist enforced by NaviMind before an action is returned; a missing/empty allowlist fails closed to `manual_review`

Optional environment variables:
- `OPENAI_API_KEY` — model access
- `NAVIMIND_AGENT_MODEL` — reasoning model (defaults to `gpt-4.1-mini`)
- `NAVIMIND_AGENT_SECRET` — shared secret for the header `x-navimind-agent-secret`

Example local flow:
1. Start NaviMind with `npm run dev`.
2. Configure `NAVIMIND_AGENT_URL=http://localhost:3000/api/agent/task` in the
   desktop agent environment.
3. The desktop agent sends its current semantic world and goal to NaviMind.
4. NaviMind returns one semantic action; the desktop agent validates, executes,
   verifies, and observes again.

Coordinates, window handles and provider/runtime identifiers remain local.

## Structured knowledge context

The bridge accepts a versioned `knowledge` envelope with `local` application/runtime
knowledge and `external` provenance-aware facts. Evidence includes confidence,
relevance, provenance, conflicts and limitations. It is untrusted model context,
not an execution instruction channel. Invalid knowledge should fail closed to
`manual_review`. This contract does not itself enable web research.

## External research

When `constraints.research_enabled=true`, NaviMind may use Tavily Search.
Server-side environment:
```text
TAVILY_API_KEY=...
NAVIMIND_AGENT_RESEARCH_MODEL=gpt-4.1-mini
NAVIMIND_RESEARCH_MAX_RESULTS=5
NAVIMIND_RESEARCH_DEPTH=basic
NAVIMIND_RESEARCH_TIMEOUT_MS=15000
```
Retrieved web content is represented as `retrieved_evidence`; source URLs and
provider relevance are kept distinct from epistemic confidence. Search content
is never treated as an execution instruction.

## Secure bridge hardening

See the [bridge hardening requirements](docs/UNIVERSAL_AGENT_BRIDGE_HARDENING.md)
and track the implementation in issues #17–#19.

**Production requirement:** the deployment must reject requests if
`NAVIMIND_AGENT_SECRET` is missing or invalid. Configure the high-entropy secret
as a server-side environment variable and in the local runtime. Do not put
secrets into URLs, client bundles, logs, or GitHub. The current route must be
hardened before it is treated as production-ready.

The desktop runtime connects to the host via outbound HTTPS. No inbound PC
port or tunnel is needed. Raw PDFs, customer files and unrestricted local paths
stay local by default; only minimized, relevant evidence should cross the bridge.
