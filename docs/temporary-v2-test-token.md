# Temporary external Windows-agent test credential

This change is **opt-in**. It does not replace or expose the existing production `NAVIMIND_AGENT_SECRET`. When unconfigured it has no effect.

The server accepts a separate `NAVIMIND_AGENT_TEST_SECRET` for the V2 protocol only, provided:
- `NAVIMIND_AGENT_TEST_ISSUED_AT` is an ISO UTC timestamp in the past;
- `NAVIMIND_AGENT_TEST_EXPIRES_AT` is an ISO UTC timestamp in the future;
- the interval is at most 120 minutes;
- the supplied secret matches the server's test secret in constant time.

After expiration, the temporary secret is rejected automatically even if Vercel still stores its environment variables. Remove all three variables afterward to reduce exposure.

## Configure safely

Generate a 256-bit random token **locally** using the script in wh-ai-parser:
` . .\tools\new_navimind_two_hour_test_secret.ps1 `

It copies the token to the Windows clipboard (does not print it), sets the current shell's V2 URL and token, and prints the two UTC timestamps. Create the three Vercel environment variables above for the intended target environment and perform a *new deployment*, as existing serverless instances do not automatically ingest changed environment variables.

Never paste or commit the token into chat, GitHub, tickets, scripts, logs, or test fixtures.

## Security boundaries

The application-level temporary secret **cannot bypass Vercel Authentication / SSO / Deployment Protection**. If requests are stopped before reaching the Next.js route, use the approved Vercel access method or authorized Trusted Sources configuration. Do not disable protection globally.

The temporary secret cannot authenticate V1. The production credential continues to work normally. Model permissions, local GUI execution policy, and confirmation requirements are unchanged.

## Tests

`npm run test:agent-bridge` includes a synthetic in-window temporary V2 token case, expired/future/over-two-hours denials, and V1 rejection. No live model calls or production secrets are required.
