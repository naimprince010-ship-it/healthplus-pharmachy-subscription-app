# ADR: Checkout admin — behaviour vs Bangla copy (split today, merge optional later)

## Status

Accepted (document current state). Merge is **not** scheduled.

## Context

Operators see two surfaces:

| Surface | Persistence | Audience |
|---------|-------------|----------|
| `/admin/settings/checkout` | Unified admin settings (`lib/admin/settings`, key `checkout`) | Flow rules: guest checkout, required fields, payment methods |
| `/admin/checkout-settings` | Dedicated API ` /api/admin/checkout/settings` | Bangla strings for checkout and order-success UI |

Both are intentional: different storage evolved separately.

## Decision

- Keep **two persistence paths** until a dedicated refactor sprint.
- **UX:** Cross-links between both pages plus card copy on `/admin/settings` (`lib/settings-config.ts`) and [`docs/admin-routes-audit.md`](admin-routes-audit.md).

## Consequences

- Operators must edit **both** places when redoing checkout end-to-end.
- Future consolidation options: (1) single Prisma/`SiteSettings` model with namespaced JSON; (2) one admin page with tabs and one API; (3) migrate copy keys into unified store with migration script.

## Links

- Behaviour form: `components/admin/settings/CheckoutSettingsForm.tsx`
- Copy page: `app/(admin)/admin/checkout-settings/page.tsx`
