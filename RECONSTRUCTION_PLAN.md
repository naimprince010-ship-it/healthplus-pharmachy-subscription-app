# RECONSTRUCTION_PLAN — HALALZI `main` @ 6de2235

Companion to `AUDIT_REPORT.md`. Ordering is by dependency, not calendar.

## 1. Module decisions

| Module | Decision | Reason |
|---|---|---|
| `app/api/setup-admin` | **Disable (delete)** | P0-01 |
| `scripts/set-admin.ts`, `scripts/test-hash.*` | **Disable (delete + purge history)** | P0-02 |
| `app/api/seed-blogs`, `app/api/admin/seed-hygiene-seo` | **Disable (delete)** | P1-05, P2-02 |
| `app/api/admin/debug/*` | **Disable** | P2-08 |
| OTP (`lib/auth/otp.ts`) | **Preserve + refactor** | Core is sound; fix rate-limit window, response DTO, secret fallback |
| Signup / password login | **Refactor** | Require OTP-verified phone; add login rate limit |
| Middleware | **Refactor** | Add `/api/admin/:path*` |
| Membership purchase | **Replace** | Activate only on settlement |
| Orders | **Refactor** | Keep server pricing; add stock reservation, atomic coupon, sequence order#, single-tx entitlements |
| Payments | **Replace / build** | No gateway exists; hide ONLINE until built |
| Inventory | **Build** | Ledger + conditional decrement |
| Prescription storage | **Replace** | Private bucket + signed URLs + ownership + audit |
| Supplier inbound/outbound | **Refactor** | HMAC + replay protection + outbox |
| Market-intel / medex scraper | **Refactor (guard) or disable** | P1-04, P1-06, P2-01 |
| Money schema | **Refactor (migrate)** | Float → Decimal |
| Build pipeline | **Refactor** | Remove migrate from build |

## 2. P0 containment (Release 0, small reversible diffs)

1. Delete `app/api/setup-admin/route.ts`, `app/api/seed-blogs/route.ts`, `app/api/admin/seed-hygiene-seo/route.ts`.
2. Add `requireAdmin()` to `medex-scraper`, `market-intel/*`, `check-generics`. Make `market-intel/sync` fail closed.
3. Return 410 from `POST /api/membership`. Reject membership line-items in `POST /api/orders` (feature flag).
4. Hide the bKash/ONLINE option in checkout (feature flag).
5. Set the Supabase `healthplus` bucket to private. Serve prescriptions via `createSignedUrl` (≤10 min) in the admin and customer views.
6. In `POST /api/prescriptions`, stop `user.upsert` by phone for unauthenticated callers. Store as an unlinked guest submission.
7. **Rotate:** admin password, MIM SMS API key, `CRON_SECRET`, `NEXTAUTH_SECRET` (forces all JWTs out), `OTP_HASH_SECRET`.
8. Change `build` to `next build`. Move migrations to a manual workflow.

**Gate G0:** each item verified on a preview deployment with a separate DB.

## 3. Phases

- **Phase 1 – Auth hardening:** signup requires OTP-verified phone; OTP rate-limit fix (keep 1h of rows) + per-IP limit; minimal verify DTO; login brute-force limit; middleware covers `/api/admin`; session version for revocation.
- **Phase 2 – Data model:** `Decimal` money (add columns → backfill → dual-write → switch reads → drop Float); enums for payment/prescription/subscription status; `AuditLog`, `PaymentEvent`, `InventoryMovement` tables; unique `(couponId,userId)` where single-use.
- **Phase 3 – Orders & inventory:** conditional stock decrement in tx; reservation TTL at checkout; cancellation restores stock once; atomic coupon `updateMany` with guard; order number from sequence; membership purchase recorded as pending in tx.
- **Phase 4 – Payments:** gateway (SSLCommerz / bKash PGW) with signed IPN, amount + currency match, idempotency key, `PaymentEvent` ledger, daily reconciliation; entitlements and supplier forward triggered only by settlement events.
- **Phase 5 – Prescription privacy** (parallel with 3–4): ownership via OTP, consent text, magic-byte validation, access audit, retention/deletion job. Legal/pharmacy-owner sign-off.
- **Phase 6 – Integrations:** supplier HMAC + timestamp + nonce + per-SKU version; forwarding outbox with idempotency key; scraper timeouts and host allowlists.
- **Phase 7 – Tests/CI/observability:** continuous from Phase 0 (see `TEST_GAP_MATRIX.md`).

## 4. Database / data migration plan

- Full backup + verified restore before every migration.
- Forward-only migrations with written compensating steps.
- Data checks before cutover: memberships without paid orders, prescriptions with public URLs, orders with `paymentStatus` outside the enum set, negative or null stock.

## 5. Security and privacy plan

Secret rotation (above), gitleaks + history purge, env validation at boot (fail closed), private storage, audit logging, rate limiting (Upstash Redis already a dependency), removal of PII from logs.

## 6. CI/CD and observability

GitHub Actions required checks on `main`: typecheck, lint, tests, `prisma validate`, gitleaks, `npm audit`. Preview deployments use a non-production DB. Gated migration job. Alerts: cron failure, payment reconciliation mismatch, stock < 0, spikes in OTP sends, admin role changes.

## 7. Release gates

| Gate | Evidence required |
|---|---|
| G0 | P0 containment items verified on preview; secrets rotated |
| G1 | T-13, T-21, T-22, T-30 green |
| G2 | T-10, T-19, T-24 concurrency tests green |
| G3 | T-03, T-04, T-05 green (no entitlement before settlement) |
| G4 | T-06, T-07 green + legal sign-off |
| G5 | Gateway webhook tests + reconciliation report, or ONLINE remains disabled |
| G6 | CI required on `main`; build has no migrate |

## 8. Rollback requirements

Feature flags for membership, ONLINE payment, and new stock enforcement. DB backup before each migration with a tested restore. Keep the COD path working throughout. Retain old Float columns until Decimal reads are verified.

## 9. First 30 tickets

1. Delete `app/api/setup-admin/route.ts`.
2. Rotate admin password; review `User` rows with `role=ADMIN`.
3. Delete `scripts/set-admin.ts`, `scripts/test-hash.ts`, `scripts/test-hash.js`.
4. Purge credentials from git history (coordinated force-push).
5. Rotate MIM SMS key; placeholder-only `.env.example`.
6. Rotate `CRON_SECRET`, `NEXTAUTH_SECRET`, `OTP_HASH_SECRET`.
7. Delete `app/api/seed-blogs/route.ts`.
8. Delete `app/api/admin/seed-hygiene-seo/route.ts`.
9. Guard + exact-host check in `app/api/admin/medex-scraper/route.ts`.
10. Fail-closed auth in `app/api/admin/market-intel/sync/route.ts` (header, not query).
11. `requireAdmin()` on `check-generics`, `market-intel`, `market-intel/comparison`.
12. Add `/api/admin/:path*` to the `middleware.ts` matcher.
13. Disable `POST /api/membership`.
14. Reject membership items in `POST /api/orders` behind a flag.
15. Hide the ONLINE/bKash option in `app/(site)/checkout/page.tsx`.
16. Make the `healthplus` bucket private; signed-URL reads.
17. Stop phone-based upsert in `POST /api/prescriptions`.
18. `build` → `next build`; create a gated migrate workflow.
19. Require OTP-verified phone in `POST /api/auth/signup`.
20. Fix OTP hourly window; add per-IP limit.
21. Minimal DTO from `POST /api/auth/otp/verify`.
22. Convert `debug/cleanup-arogga` to POST or remove it.
23. Add Vitest + test DB; implement T-01…T-07.
24. Add GitHub Actions with gitleaks; make it required on `main`.
25. Stock: conditional decrement in order tx + T-10.
26. Coupon: atomic guarded increment + T-19.
27. Order number from sequence + T-24.
28. `AuditLog` + `PaymentEvent` tables; audit manual PAID.
29. Decimal money migration (phase 1: add + backfill).
30. Magic-byte validation for prescription uploads.

## 10. Containment branch verification

Verified on `codex/p0-security-containment` in `E:\HALALZI_CONTINUE`:

- `npm test`: 7 files, 71 active tests passed; 103 exhaustive per-route imports intentionally skipped because they exceed the Node heap. Middleware, representative handlers, cron auth, and SSRF checks remain active.
- `tsc --noEmit`: passed.
- `prisma validate`: passed.
- Focused ESLint for all containment files: passed. Repository-wide lint remains a baseline blocker (150 errors, 157 warnings).
- `next build`: passed without a reachable database after making `/` dynamic. Some optional settings loaders still log handled `ECONNREFUSED` messages during static generation; build exits 0.
- OTP per-IP control: shared Upstash Redis fixed window, 10 sends per 10 minutes, hashed IP keys, production fail-closed when Redis or a trusted client IP is unavailable.
- Inventory: active/in-stock checks during pricing plus conditional `updateMany` decrement inside the order transaction; concurrent stock=1 test permits exactly one claim.
- Cancellation: compare-and-set status transition restores inventory once; terminal states cannot be reopened and shipped orders cannot be cancelled.
- Coupons/order IDs: limited coupons use guarded atomic increment; order numbers use cryptographic randomness and passed a 10,000-ID collision test.

Remaining external G0 actions are tracked in `SECURITY_ROTATION_CHECKLIST.md`: credential rotation, Supabase bucket privacy change, production data review, and coordinated git-history purge.