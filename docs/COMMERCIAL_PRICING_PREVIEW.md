# NaviMind pricing / payment-preview (draft)

## Scope
- Display-only catalogue: `/plans`, also available via existing `/pro` navigation.
- Four commercial tiers: Personal Starter (49 PLN gross, AI cost allowance 5 PLN), Personal Pro (119 PLN gross, 18 PLN), Business (399 PLN net, 70 PLN), Business Custom (999 PLN net, 180 PLN).
- Monthly PLN display, no annual commitment. Prices are proposals, not live offers.
- `/checkout?plan=...` safely displays selected tier and *does not* collect any payment or personal information.
- No Lemon Squeezy URLs or enabled pay buttons. No webhook, activation, usage, authorization or runtime integration.
- Legacy `app/lib/plans.ts` and PRO/PRO+ user entitlements are deliberately untouched. Commercial plans belong to separate `app/lib/commercialPlans.ts` and **must not** be treated as entitlements.

## Before payments are enabled
1. Confirm legal business, taxes, terms/refunds/privacy, consumer rights, invoicing and EU VAT treatment.
2. Choose payment provider; resolve any previous provider account restrictions.
3. Implement server-side authenticated checkout endpoint, approved product/price IDs, webhook signature verification and idempotency, subscription state machine, refunds and cancellation.
4. Implement separate server-side mapping from paid subscriptions to signed license entitlements; do not trust query strings, client-side plan IDs or redirects as proof of payment.
5. Add atomic AI usage accounting with currency conversion rules, hard caps, safe stop, fraud/abuse controls and per-task budgets.
6. Define BYOK security: keys encrypted at rest or kept strictly locally, never exposed to logs or third parties.
7. Run end-to-end tests using payment sandbox and a test customer; verify no legacy PRO/PRO+ privilege escalation.

## Developer acceptance
- `/plans` shows two Personal and two Business cards with correct net/gross labels.
- Clicking each plan opens the matching `/checkout?plan=...` preview.
- Invalid plan identifiers show a safe fallback.
- No live payment, no automatic activation and no legacy entitlements are modified.
- Run `npm run build` (requires existing environment setup) before merge.
