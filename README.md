# NaviMind - Clean Build

This is a minimal clean scaffold for the NaviMind chat app (Next.js).
Files included: API chat + PDF processing, minimal chat UI, store and modes.

Instructions:
1. Configure required server-side environment variables for the feature being used.
2. Run `npm install`, then `npm run dev`.
3. See the route implementation and feature-specific docs for current supported operations.

## Universal desktop agent bridge

NaviMind provides reasoning and context for the local `wh-ai-parser` desktop agent. The desktop runtime remains responsible for filesystem access, UI perception, local action validation, physical execution and verification.

Endpoint: `POST /api/agent/task`.

The endpoint proposes at most one semantic action, `done`, or `manual_review`. Coordinates, window handles, runtime/provider IDs and physical execution remain local.

Relevant environment variables:
- `OPENAI_API_KEY` — server-side model access.
- `NAVIMIND_AGENT_MODEL` — optional reasoning model.
- `NAVIMIND_AGENT_SECRET` — high-entropy server-side shared secret required by the desktop bridge.
- `NAVIMIND_AGENT_ALLOW_DEV_BYPASS=1` — explicit non-production-only opt-in for local development without the shared secret.

**Do not treat the agent route as production-ready until PR #20 is reviewed, built and tested.** It is intended to fail closed when authentication is not configured. Configure the same secret in the deployment and local runtime; never put it in a URL, client bundle, commit or log.

## Structured knowledge and external research

The task contract can contain local application/runtime knowledge and external provenance-aware evidence. This content is untrusted model context, not an execution instruction channel. Retrieved web evidence keeps source URLs and provider relevance separate from epistemic confidence. Research is bounded/configuration-driven and does not authorize actions.

## Security and full-flow plan

- Bridge hardening epic: [#17](https://github.com/wisnialeszno89/navimind/issues/17)
- Endpoint hardening implementation PR: [#20](https://github.com/wisnialeszno89/navimind/pull/20)
- Automated route tests: [#22](https://github.com/wisnialeszno89/navimind/issues/22)
- Integration deployment checklist: [#19](https://github.com/wisnialeszno89/navimind/issues/19)
- Local task workflow epic: [wh-ai-parser #59](https://github.com/wisnialeszno89/wh-ai-parser/issues/59)
- [Bridge hardening requirements](docs/UNIVERSAL_AGENT_BRIDGE_HARDENING.md)

The desktop connects to the hosted server over outbound HTTPS. **No inbound port, port-forwarding or internet tunnel to the user's PC is required.** Raw PDFs, customer files and unrestricted local paths remain local by default; only minimized, relevant evidence should cross the bridge.
