# NaviMind – license issuance and desktop activation (design only)

## Current hard boundary
This branch is a **public-facing static preview only**.
- No new payment endpoint, session, charge, webhook, database write, issued code, live download or desktop pairing is implemented.
- `/checkout` and `/license` render **non-operational** views; all code-entry, activation and download controls on `/license` are disabled.
- No existing desktop bridge route, legacy PRO/PRO+ entitlement, role, key or agent runtime is modified.
- A license code is **not** a remote access credential: it grants an entitlement to an authenticated local agent only, and does not automatically authorize remote commands.

## Future architecture – not implemented
1. Customer authenticates; server creates a provider checkout session using server-controlled plan/price identifiers only.
2. Payment service sends signed webhook. Verify signature, replay protection and idempotency; validate subscription is paid and active server-side.
3. Create subscription entitlement in durable DB: account, sku, period, seats, usage, status. Generate unpredictable one-time activation token; store **only its cryptographic hash** with expiry; never embed a secret in the checkout URL.
4. Show the token to the authenticated purchaser once (with secure reissue/revoke support). Do not issue codes on browser redirect/success page alone.
5. Local desktop installer should be code-signed. After local user login and consent, pair device using secure outbound HTTPS, verify token and bind a revocable device identity to the entitled seat. Protect local tokens with OS credential storage.
6. Separate **subscription entitlement** from **desktop session authorization**, and from **approval to execute sensitive actions**. No unsolicited inbound connections, no unattended access without explicit setup and permitted scope.
7. Enforce seat count and subscription status on the server, cache limited offline grants if desired, and offer revoke/unpair/self-service device management.
8. Bill AI only against the active plan; implement metered actual API spend, task caps, audit logs and safe-stop. Treat BYOK keys as customer secrets, never mix with billing credentials.
9. Handle failed payments, refunds, chargebacks, canceled subscriptions, renewal delays, device changes, account recovery and fraud.
10. Test sandbox payments, signed webhook replay, authorization, license issuance, multiple devices, expired codes, device revocation, security/privacy and accessibility before enabling production.

## Public preview routes
- `/plans`: proposed pricing and allowances
- `/pro`: old navigation entry displaying proposed catalogue (legacy entitlement semantics unchanged)
- `/checkout?plan=personal-pro`: safe payment preview
- `/license`: safe post-purchase and pairing flow explanation

## Acceptance
All pages must remain usable without an authenticated session or external provider. No working activation control, payment URL, actual key or desktop connection is added by this PR.
