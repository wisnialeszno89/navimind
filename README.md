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

PR #20 is merged and the route has automated auth, bounds and contract tests. That proves the code path, not the deployed configuration. Before relying on the bridge, verify the Vercel Production environment contains both `NAVIMIND_AGENT_SECRET` and `OPENAI_API_KEY`, then run the authenticated synthetic smoke test described below. Configure the same high-entropy secret in Vercel and the local runtime; never put it in a URL, client bundle, commit or log.

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

### Production readiness check

1. In the Vercel project for this repository, set `OPENAI_API_KEY` and `NAVIMIND_AGENT_SECRET` for **Production** (not only Preview). Keep both server-side.
2. Copy the canonical HTTPS deployment origin from Vercel. Set the local `NAVIMIND_AGENT_URL` to `https://YOUR-DEPLOYMENT/api/agent/task` and set the same secret in the local `.env` file. Never paste the secret into chat or a GitHub file.
3. Run `python tools/smoke_windows_desktop_navimind.py` from the local `wh-ai-parser` repository root. It uses a synthetic scene and does not click, type or otherwise act on the computer.
4. The reasoning API call is capped at 25 seconds with automatic OpenAI SDK retries disabled, below the local runtime's 45-second HTTP timeout.
5. A successful Vercel build or unit test alone does not confirm that Production secrets are present. Keep the bridge marked unverified until the authenticated smoke test succeeds.

