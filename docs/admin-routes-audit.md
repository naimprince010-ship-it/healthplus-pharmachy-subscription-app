# Admin routes audit

Concise map of admin URLs, purpose, and backing data. Update as features change.

| Path | Purpose | API / data source | Duplicate / notes |
|------|---------|-------------------|-------------------|
| `/admin/memberships` | CRUD membership plans (`MembershipPlan`), list | Prisma `membershipPlan` | **Canonical** membership plan admin (sidebar). |
| `/admin/membership` | Legacy duplicate of membership plans list | Same as above | **Redirects** to `/admin/memberships` (bookmarks preserved). Dashboard card updated to canonical URL. |
| `/admin/membership-settings` | Public `/membership` page copy/UI config | `/api/admin/membership-settings` | Different feature: storefront page, not plan CRUD. |
| `/admin/membership-banner` | Membership promo banner assets | `/api/admin/membership-banner` | Distinct from plans. |
| `/admin/subscription-plans` | Subscription SKUs (`SubscriptionPlan`) for subscriptions product | Prisma `subscriptionPlan` | **Not** the same model as memberships; naming is easy to confuse. |
| `/admin/subscriptions` | User subscription orders / fulfilment views | Subscription-related admin queries | Consumer subscriptions, not `MembershipPlan`. |
| `/admin/settings/checkout` | Checkout **behaviour**: required fields, payment method toggles, flow options | `lib/admin/settings` key `checkout` (unified settings store) | Pairs with Bangla copy page below; see **Checkout settings split**. |
| `/admin/checkout-settings` | Checkout **Bangla UI copy**: section titles, buttons, success page strings | `/api/admin/checkout/settings` | Does not replace behaviour form; operators should edit both when changing checkout. |

## Checkout settings split (one line)

- **Behaviour / validation / payment options** → `/admin/settings/checkout` (Settings hub → Checkout) via `CheckoutSettingsForm` and `fetchSettings('checkout')`.
- **Labels and Bangla microcopy on the checkout & success UI** → `/admin/checkout-settings` and `GET/PATCH /api/admin/checkout/settings`.

Future optional work: merge into one admin surface and one persistence layer (see `docs/admin-checkout-settings-adr.md`).

## Subscriptions vs memberships (one line)

- **Membership** = `MembershipPlan` / `UserMembership` (access tier, separate commerce path).
- **Subscriptions** = `SubscriptionPlan` + subscription checkout flow (different product type). Keep both in the audit table so staff training docs stay clear.

## See also

- [admin-external-references.md](admin-external-references.md) — bookmark search phrases for improving admin UX from public repos (patterns only).
- [admin-checkout-settings-adr.md](admin-checkout-settings-adr.md) — decision record for the checkout settings split vs future merge.
