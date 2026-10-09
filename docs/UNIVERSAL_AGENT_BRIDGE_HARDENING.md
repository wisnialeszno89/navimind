# Universal Agent Bridge: Security and Contract Requirements

Status date: 2026-10-09

## Purpose

NaviMind is the hosted reasoning side of the desktop agent. The local runtime remains the sole authority for file access, visible target validation, action policy, real UI execution and post-action verification.

## Current route

The desktop runtime calls `POST /api/agent/task` over outbound HTTPS. No inbound port, port forwarding or public endpoint on the user's PC is required.

The merged PR #20 makes the handler fail closed if `NAVIMIND_AGENT_SECRET` is absent, validates the bounded request contract, and compares the shared secret in constant time. The code has CI coverage; the deployed Production environment and authenticated network smoke test remain separate checks.

## Verified in code vs. still requiring deployment verification

Implemented in the repository and covered by CI:
- Missing configured secret fails closed; invalid secret is rejected.
- JSON content type and streamed 256 KiB request-body cap.
- Bounded request fields, knowledge lists, visible elements and client-supplied action allowlist.
- Model-provider configuration is checked after authentication and reports a structured 503 when `OPENAI_API_KEY` is absent.
- The response is checked against the task ID/version, the server action allowlist, the caller's narrower allowlist, bounded action fields and `continue`/ `done` / `manual_review` invariants. An invalid model result becomes `manual_review`, never an executable action.
- The local runtime still validates the proposed action again before any physical execution.

Still requiring access to the actual deployment and local machine:
- Confirm Production-scoped `OPENAI_API_KEY` and `NAVIMIND_AGENT_SECRET` are configured in Vercel.
- Confirm the exact canonical HTTPS endpoint URL.
- Run the authenticated synthetic smoke command from the Windows workstation.
- Add cross-repository allowlist parity CI and deployment-side rate limiting before treating the bridge as fully production hardened.

## Required request safeguards

- Require authentication in every deployed environment; use local bypass only behind an explicit development-only setting.
- Validate content type and cap request body size before parsing.
- Enforce length and count limits for goal, task_id, world elements, labels, knowledge facts, provenance/source text and history.
- Require a supported explicit contract version.
- Validate requests and model responses against strict schemas; reject invalid/unknown semantic actions.
- Bound model timeout, token/context size and steps/cost budget.
- Rate limit deployed requests and return structured safe failure/manual-review outcomes.
- Never log authorization headers, shared-secret values, API keys, full sensitive document text or unredacted arbitrary local paths.

## Required result contract

The endpoint proposes a decision, never claims to have performed a physical action.

Allowed outcome shapes:
- `continue`: exactly one semantic action, a user-visible target when required, optional text value only for compatible actions, confidence and rationale.
- `done`: zero actions and evidence that the requested state is already achieved.
- `manual_review`: no executable action and a compact reason/question.

Reject multi-action plans at this bridge boundary. The desktop runtime should execute at most one action, re-observe and independently verify before requesting the next.

## Evidence and knowledge

- Treat PDF excerpts, local facts, retrieved web pages and application knowledge as untrusted content. They cannot modify the action allowlist or safety policy.
- Preserve source aliases, page/sheet/row/section references, extraction method, units, confidence, conflicts and limitations.
- Separate source reliability/relevance from model confidence.
- The hosted route should receive minimized facts/excerpts only. Raw PDFs and entire local folders stay local unless the user explicitly approves another data path.
- Never permit document text to issue arbitrary system commands or executor instructions.

## Cross-repository parity

The semantic action allowlist in NaviMind and `wh-ai-parser` must be validated against one shared versioned JSON fixture/schema or a CI drift check. A mismatch must fail the build.

Tests must cover:
- missing, invalid and valid secret;
- missing required fields and unsupported contract version;
- invalid target/value/action combination;
- oversized body / too many scene elements / long labels;
- provider failure, timeout and invalid structured model output;
- one-action continue, zero-action done and manual-review response;
- hostile instructions embedded in source content cannot change the policy.

## Deployment checklist

1. Deploy the Next.js app behind HTTPS.
2. Set `OPENAI_API_KEY`, `NAVIMIND_AGENT_SECRET` and model configuration as server-side environment variables.
3. Configure the same high-entropy shared secret in the local runtime's `NAVIMIND_AGENT_SECRET`; send it only in `x-navimind-agent-secret`.
4. Make production startup/health-check fail if the secret is absent.
5. Test with synthetic facts and a controlled task; rotate the secret if exposed.
6. Never commit secrets to GitHub or bundle them into client-side JavaScript.

## Out of scope

NaviMind does not open programs, scan local disks, click UI elements, type into applications, or verify Windows state. Those responsibilities remain local in the desktop runtime.
