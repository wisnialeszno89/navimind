# Platinum Violet – NaviMind design preview (2026-11-12)

This branch starts from `feat/navimind-commercial-pricing-preview-20261112` (draft PR #31).
It is a **design-only change**; it is not based on, or merged into, production `main`.

## Visual tokens
- Platinum background: `#F8F8FB`
- White surface: `#FFFFFF`
- Graphite text: `#1C1B25`
- Primary violet: `#6753A6`, hover: `#51408E`
- Violet soft background: `#EEEBF8`
- Silver border: `#DADAE1`
- Restrained gold accent: `#B69A62`

## Scoped implementation
Marketing routes use `.nm-page`, `.nm-card`, `.nm-btn-primary`, `.nm-btn-secondary`.
The global dark chat and protected Workspace remain untouched. The public header
switches to the light palette only when a marketing route is displayed.

Updated routes: `/`, `/agent`, `/plans`, `/checkout?plan=...`, `/license`.

## Safety and acceptance
- The public `/agent` is a safe entry to the existing public chat; it does NOT grant desktop access.
- Protected `/agent` continues to redirect to the existing private `/workspace` with its original pairing flow.
- Payment links, licenses, activations and installer download remain **disabled**.
- No payment API, license API, runtime authorization, bridge code, or existing checkout provider was changed.
- Verify `npm run build` via the Vercel preview associated with the head commit.
- Test desktop/mobile page sizes and keyboard navigation.
- Do not merge the preview branch until PR #31 is reviewed; production should not change during design testing.
