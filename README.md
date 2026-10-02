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
