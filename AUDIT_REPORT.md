# HALALZI — Security & Reliability Audit (re-audit against `main`)

- **Repository:** `C:\Users\User\OneDrive\Documents\ChatGPT\HALALZI.COM`
- **Branch / HEAD:** `main` @ `6de223565f7eb396b8a10d1170543d73b03da0b0` (clean, tracking `origin/main`)
- **Remote:** `https://github.com/naimprince010-ship-it/healthplus-pharmachy-subscription-app.git`
- **Date:** 2026-10-14
- **Mode:** Read-only. No source edited, no migrations/seeds/syncs/deploys, no HTTP calls to any environment.
- **Supersedes:** the earlier report generated from `E:\halalzi.com` (branch `chore/admin-nav-consistency` @ `06b72db`), which was **not** `main` and is withdrawn.

All line numbers below were re-read from `main` HEAD. Credentials are redacted as `[REDACTED]`.

---

## 1. Executive summary

The current `main` has a **sound OTP implementation** (DB-backed `OtpSession`, HMAC-SHA256 hashing, `timingSafeEqual`, 5-min TTL, 5-attempt cap, `verifiedAt` replay guard). The previous "any 6-digit OTP" finding is **withdrawn**.

However, `main` still contains **six confirmed P0 defects**:

1. **`GET /api/setup-admin` is public** and creates or resets an ADMIN account to a hard-coded password, so anyone who calls it can then sign in as admin.
2. **Admin credentials are committed** in four tracked files (including a bcrypt hash).
3. **`POST /api/membership` grants a paid membership with no payment.**
4. **Membership line-items in `POST /api/orders` activate immediately**, even for unpaid `ONLINE` orders, and outside the order transaction.
5. **Prescriptions are stored in a public bucket** and persisted as permanent public URLs.
6. **Guest prescription upload attaches to any existing account** by phone number, with no ownership proof.

Major P1 issues include: no stock check or decrement on orders, no online-payment gateway, signup pre-hijacking of phone accounts, an unauthenticated SSRF in `medex-scraper`, unauthenticated DB-writing GET endpoints, `prisma migrate deploy` inside `build`, a probable live SMS API key in `.env.example`, and no tests or CI.

**Recommendation:** staged reconstruction, starting with a P0 containment release. **Not production-ready.**

| Severity | Count |
|---|---|
| P0 | 6 |
| P1 | 10 |
| P2 | 11 |
| P3 | 8 |

---

## 2. Audit scope and limitations

**Inspected on `main`:** `lib/auth/otp.ts`, `lib/auth.ts`, `lib/auth.config.ts`, `app/api/auth/**`, `app/api/setup-admin`, `scripts/set-admin.ts`, `scripts/test-hash.{ts,js}`, `.env.example` (names + masked shape only), `app/api/orders/route.ts`, `lib/order-pricing-quote.ts`, `lib/order-payment-status.ts`, `app/api/membership`, `app/api/subscriptions`, `app/api/prescriptions`, `lib/supabase.ts`, `middleware.ts`, all 104 `app/api/admin/**/route.ts` (guard scan + manual read of every flagged file), `app/api/seed-blogs`, `app/api/db-health`, `package.json`, `vercel.json`, `prisma/schema.prisma`, `lib/notifications.ts`, `lib/settings/server.ts`, `lib/integrations/azan-inbound-update.ts`.

**Totals:** 162 `route.ts` files under `app/api` (104 under `app/api/admin`).

**Not performed:**
- `npm run build`: `build` runs `node scripts/prisma-migrate-deploy.cjs` first, which would migrate the DB configured in env. **Unsafe; skipped.**
- `npx tsc --noEmit`, `npm run lint`, `npx prisma validate`: not run in this pass (no output claimed).
- Live Supabase bucket ACL, deployed env values, live endpoint reachability: **runtime verification required.**
- Full git-history secret scan: only counted 21 commits touching the credential-bearing files. Contents were not extracted.
- Not re-verified on `main` in this pass, so excluded from counts: ZIP/CSV import hardening, AI endpoint cost limits, Markdown/HTML sanitization, supplier-forward durability, Product/Medicine dual source of truth, `facebook-catalog` exposure, accessibility/SEO runtime checks.

---

## 3. Repository / architecture map

```
middleware.ts               matcher: /admin/:path*, /dashboard/:path*   (NOT /api/admin)
lib/auth.config.ts          JWT 30d, role in token, trustHost
lib/auth.ts                 Credentials provider: OTP (verifyOTP) or password (bcrypt)
lib/auth/otp.ts             DB OtpSession + HMAC + timingSafeEqual + attempts + verifiedAt
app/api/
  setup-admin/              PUBLIC GET → upserts ADMIN with hard-coded creds        (P0)
  seed-blogs/               PUBLIC GET → creates/overwrites PUBLISHED blogs          (P2)
  auth/{signup,otp/*}       Public auth
  orders/                   Server-priced orders; no stock; membership activation    (P0/P1)
  membership/               Activates membership without payment                     (P0)
  subscriptions/            Creates pending/unpaid (OK)
  prescriptions/            Public bucket + guest-to-account binding                 (P0)
  update-stock|update-product  Supplier inbound, static bearer secret
  admin/** (104)            Per-route guards; 6 handlers have none
  cron/** (6)               requireCronAuth (Bearer CRON_SECRET)
prisma/schema.prisma        Money = Float; Order.paymentStatus = String
```

**Sources of truth:**
- **Pricing:** `lib/order-pricing-quote.ts`. The client `items[].price` is validated (`orders/route.ts:31`) but ignored for totals, which is good.
- **Payment state:** `Order.paymentStatus` (String). The only writer of `PAID` is the admin PATCH.
- **Membership:** `UserMembership.isActive/endDate`, written from three paths (`/api/membership`, `/api/orders`, admin).
- **Stock:** `Product.stockQuantity` / `Medicine.stockQuantity`, written only by supplier inbound and admin tools, never by orders.

---

## 4. P0 findings

### [P0-01] Public GET `/api/setup-admin` creates/resets an ADMIN with a hard-coded password
- **Severity:** P0
- **Confidence:** Confirmed (code, tracked in git, commit `3006f23`). Deployed reachability needs runtime verification.
- **Category:** Authentication / Authorization / Secrets
- **File:** `app/api/setup-admin/route.ts`
- **Lines:** 5–10, 19–38
- **Evidence:**
  ```ts
  5: export async function GET() {
  7:   const adminEmail = '[REDACTED]'
  8:   const adminPassword = '[REDACTED]'
  ...
  29:  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN', password: hashedPassword, ... } })
  ```
  No `auth()`, no secret, no environment gate. `middleware.ts:31` does not match `/api/*`.
- **Why vulnerable:** Unauthenticated state-changing GET that grants ADMIN with a password published in the repository.
- **Attack scenario:** An attacker requests `GET https://<site>/api/setup-admin`, then signs in at `/auth/signin` with the committed email and password and gets full admin access (orders, prescriptions, PII, catalog, payment status). Any crawler or link-prefetch hit also silently resets the admin password.
- **Impact:** Complete platform takeover; health-data breach.
- **Remediation:** Delete the route. Rotate the admin password and invalidate sessions. Bootstrap admins only via a one-off CLI using env-supplied credentials.
- **Regression test:** Route-inventory test asserting `/api/setup-admin` does not exist (404). A generic test that no unauthenticated handler can write `role: 'ADMIN'`.

### [P0-02] Admin credentials and a bcrypt hash committed in tracked files
- **Severity:** P0
- **Confidence:** Confirmed (all four files tracked; 21 commits touch credential files)
- **Category:** Secrets
- **Files / Lines:**
  - `scripts/set-admin.ts` L7–10 (email, plaintext password, phone, name)
  - `scripts/test-hash.ts` L4–5 (same plaintext password + bcrypt hash)
  - `scripts/test-hash.js` L4–5 (same)
  - `app/api/setup-admin/route.ts` L7–10 (same)
- **Evidence:** `const adminPassword = '[REDACTED]'`, `const oldHash = '$2a$10$[REDACTED]'`.
- **Why vulnerable:** Anyone with repo access (and anyone with history access, even after deletion) holds the admin password.
- **Attack scenario:** Credential stuffing against `/auth/signin`, or reuse of the same password on email or other services.
- **Impact:** Admin takeover; personal account compromise of the owner.
- **Remediation:** Rotate the password everywhere it is used. Remove the files. Purge history (`git filter-repo`) and force-push only after team coordination. Add gitleaks to CI.
- **Regression test:** CI gitleaks scan fails on committed secrets/PII.

### [P0-03] `POST /api/membership` activates a paid membership with no payment
- **Severity:** P0
- **Confidence:** Confirmed
- **Category:** Payment / Entitlement
- **File:** `app/api/membership/route.ts`
- **Lines:** 16–25, 45–53
- **Evidence:**
  ```ts
  16: const { planId } = await request.json()
  45: const membership = await prisma.userMembership.create({
  51:     isActive: true,
  ```
  No order, payment record, or `paymentStatus` check precedes activation.
- **Attack scenario:** Any logged-in user (OTP login is free) POSTs `{ "planId": "<id>" }` and immediately receives the plan's `discountPercent` on every subsequent order (`order-pricing-quote.ts` reads the active `UserMembership`).
- **Impact:** Unlimited free memberships and discount leakage.
- **Remediation:** Disable this route, or make it create a pending purchase activated only by verified settlement.
- **Regression test:** POST without a settled payment must not create an `isActive: true` membership.

### [P0-04] Membership line-items in orders activate before payment and outside the order transaction
- **Severity:** P0
- **Confidence:** Confirmed
- **Category:** Payment / Transaction integrity
- **File:** `app/api/orders/route.ts`
- **Lines:** 214 (tx start), 259 (order create), 364–410 (membership loop after tx), 377/383/391/406 (writes)
- **Evidence:**
  ```ts
  364: for (const membershipItem of membershipItems) {
  391:   await prisma.userMembership.create({ data: { ..., isActive: true } })
  ```
  The loop runs after `$transaction` commits, unconditionally. It never checks `paymentMethod` or `orderReadyForFulfillment()` (computed later, at L443).
- **Attack scenario:** The user submits `paymentMethod: 'ONLINE'` with a membership item. The order is created as `AWAITING_PAYMENT`, the membership becomes active immediately, and the user never pays. A COD membership order can also be refused at the door after the discount has already been used. If any write in L364–410 throws, the order exists but membership is half-applied, and the client gets a 500 and may retry, creating a duplicate order.
- **Impact:** Free entitlements; inconsistent state; duplicate orders.
- **Remediation:** Record the membership purchase in the order transaction as pending. Activate it only on a verified settlement event (gateway webhook, or COD delivered + cash reconciled).
- **Regression test:** An ONLINE order with a membership item leaves membership inactive until `paymentStatus=PAID`. A forced failure after the tx leaves no partial entitlement.

### [P0-05] Prescription files stored in a public bucket and persisted as permanent public URLs
- **Severity:** P0
- **Confidence:** Confirmed (code). Live bucket ACL needs runtime verification.
- **Category:** Health-data privacy
- **File:** `lib/supabase.ts`, `app/api/prescriptions/route.ts`
- **Lines:** `lib/supabase.ts` 250 (`bucket = 'healthplus'`), 258 (`public: true`), 286 (`getPublicUrl`). `prescriptions/route.ts` 92 (`fileUrl: uploadResult.url`), 119 (full record returned).
- **Evidence:**
  ```ts
  258:        public: true,
  286:    .getPublicUrl(data.path)
  ```
  `getSignedUrl()` exists at `lib/supabase.ts:51` but is not used for prescriptions.
- **Attack scenario:** The URL (`.../storage/v1/object/public/healthplus/prescriptions/<ms>-<6 chars>.<ext>`) never expires and requires no auth. Anyone who obtains it (logs, shared links, browser history, admin screenshots, referrers) can read the prescription indefinitely.
- **Impact:** Disclosure of health data; legal/regulatory exposure (requires legal review).
- **Remediation:** Make the bucket private. Store only the object path. Issue short-lived signed URLs per authorized request. Log access. Migrate existing objects.
- **Regression test:** An unauthenticated fetch of a stored prescription path returns 400/403. Authorized access returns a signed URL that expires.

### [P0-06] Guest prescription upload attaches to an existing account by phone number
- **Severity:** P0
- **Confidence:** Confirmed
- **Category:** Health-data integrity / Account integrity
- **File:** `app/api/prescriptions/route.ts`
- **Lines:** 58–72
- **Evidence:**
  ```ts
  62: const guestUser = await prisma.user.upsert({
  63:   where: { phone: normalizedPhone },
  64:   update: {},
  ```
  Unauthenticated callers supply any `phone`. The prescription gets that existing user's `userId`.
- **Attack scenario:** An attacker uploads a fabricated or offensive prescription with a victim's phone. It appears in the victim's `GET /api/prescriptions` history (L139–141) and in the pharmacist queue under the victim's identity, and the victim receives an SMS (L113). This can also seed the admin `create-order` flow against the victim's account.
- **Impact:** Integrity of medical records; harassment vector; pharmacist decisions on forged data.
- **Remediation:** Require an authenticated session or OTP-verified phone before linking. Otherwise store an unlinked guest submission.
- **Regression test:** An unauthenticated upload using an existing user's phone does not set that user's `userId`.

---

## 5. P1 findings

### [P1-01] Orders never check, reserve, or decrement stock
- **Confidence:** Confirmed · **Category:** Inventory
- **File:** `app/api/orders/route.ts` L214–330. `lib/order-pricing-quote.ts` L53–75.
- **Evidence:** The pricing quote loads products/medicines with no `stockQuantity`/`inStock`/`isActive` filter. The order transaction creates items with no stock write. A repo-wide scan of `app/` and `lib/` found no `stockQuantity: { decrement }` and no reservation logic.
- **Scenario:** Two customers order the last unit concurrently and both succeed. An out-of-stock or inactive product can also still be ordered by ID.
- **Impact:** Oversell, cancellations, supplier mismatch. Downgraded from P0 because fulfillment is partly supplier-forwarded (Azan), but local inventory is meaningless.
- **Remediation:** Within the order transaction, run a conditional decrement (`UPDATE … SET stock = stock - q WHERE id = ? AND stock >= q`; zero rows means reject). Add an inventory ledger and restore stock exactly once on cancellation.
- **Regression test:** 10 parallel orders against stock=1 produce exactly 1 success, and stock never goes negative.

### [P1-02] "Online payment" (bKash/Nagad) has no gateway, verification, or reconciliation
- **Confidence:** Confirmed · **Category:** Payment
- **Files:** `app/(site)/checkout/page.tsx` L425 (`BKASH → 'ONLINE'`), L831. `lib/order-payment-status.ts` L13–25. `app/api/admin/orders/[id]/payment/route.ts` L19–25, L55, L88.
- **Evidence:** No gateway or webhook code exists in `app/` or `lib/` (scan for sslcommerz/bkash API/webhook/ipn/tran_id/signature returned nothing). The only `PAID` writer is the admin PATCH (`data: { paymentStatus: nextStatus }`), which also triggers `forwardOrderToAzanById` with no audit record.
- **Scenario:** A customer selects bKash and is redirected with `awaitingPayment=1`. There is no way to pay in-app. Staff mark orders paid manually without a transaction reference. A mistaken or malicious admin click forwards an unpaid order to the supplier.
- **Remediation:** Hide the ONLINE option until a gateway with signed callbacks, amount/currency matching, idempotency, and reconciliation exists. Meanwhile require a transaction reference plus an audit log for manual `PAID`.
- **Regression test:** An ONLINE order cannot reach fulfillment or supplier-forward without a verified payment event. Manual PAID requires a reference and writes an audit row.

### [P1-03] Signup lets anyone pre-register a victim's phone with an attacker-chosen password (no OTP)
- **Confidence:** Confirmed · **Category:** Authentication
- **File:** `app/api/auth/signup/route.ts` L40–74. `lib/auth/otp.ts` L135–149.
- **Evidence:** Signup creates `{ phone, password: hash(attacker), role: 'USER' }` with no phone verification. Later, `verifyOTP` does `prisma.user.findUnique({ where: { phone } })` and logs the real owner into that same record.
- **Scenario:** The attacker registers the victim's number with their own password. The victim later logs in by OTP and adds addresses, orders, and prescriptions. The attacker logs in with the password and reads all of it. The 409 responses at L47–62 also enumerate registered phones and emails.
- **Remediation:** Require OTP verification before setting a password on a phone. Invalidate any pre-existing password on first OTP login. Return uniform responses.
- **Regression test:** Signup without verified OTP cannot create a password-bearing account. After OTP login, the prior unverified password no longer works.

### [P1-04] Unauthenticated SSRF in `POST /api/admin/medex-scraper`
- **Confidence:** Confirmed · **Category:** API security / SSRF
- **File:** `app/api/admin/medex-scraper/route.ts` L26–34
- **Evidence:**
  ```ts
  30: if (!url || !url.includes('medex.com.bd')) {
  34: const response = await fetch(url, { headers: HEADERS });
  ```
  There is no auth call in the file, and middleware does not cover `/api/*`. The allowlist is a substring check.
- **Scenario:** `{"url":"http://127.0.0.1:9001/…?medex.com.bd"}` or `http://internal-host/#medex.com.bd` makes the server fetch arbitrary URLs. The parsed title and fields are reflected back, and the route can be used for anonymous scraping/DoS from the site's IP.
- **Remediation:** Add `requireAdmin()`. Parse the URL and require `hostname === 'medex.com.bd'` (or a subdomain) over `https`. Disable redirects or re-validate them, and add a timeout.
- **Regression test:** Unauthenticated → 401/403. `http://evil.com/?medex.com.bd` → 400.

### [P1-05] Unauthenticated DB-writing GET `/api/admin/seed-hygiene-seo`
- **Confidence:** Confirmed · **Category:** Authorization / Mutation-through-GET
- **File:** `app/api/admin/seed-hygiene-seo/route.ts` L4–58
- **Evidence:** `export async function GET` with no auth. Every call creates a `BlogTopic` (L10) and a `Blog` (L20), and appends to `category.seoKeywords` (L55).
- **Scenario:** A crawler or attacker loops the URL, creating unbounded rows and growing a category's SEO keywords string without limit (visible in page metadata). Link prefetchers trigger it too.
- **Remediation:** Delete the route (one-off seed), or move it to an admin-guarded POST.
- **Regression test:** Unauthenticated GET → 401/404. No route exports a mutating GET (lint rule).

### [P1-06] `/api/admin/market-intel/sync` is open when `MARKET_INTEL_CRON_SECRET` is unset; the secret travels in the query string
- **Confidence:** Confirmed (code) / Needs runtime verification (env) · **Category:** Authorization
- **File:** `app/api/admin/market-intel/sync/route.ts` L4–11, L37–39
- **Evidence:**
  ```ts
  8: // Only require token if MARKET_INTEL_CRON_SECRET is set
  9: if (cronSecret && token !== cronSecret) {
  ```
  It is not wired into `vercel.json` crons (which call `/api/cron/market-intel`). Both GET and POST trigger `runMarketIntelSync()`.
- **Scenario:** If the env var is missing in any environment, anyone can trigger competitor scraping and DB inserts repeatedly. If it is set, the token leaks via access logs and referrers.
- **Remediation:** Fail closed. Use `requireAdmin()` or `requireCronAuth()` (Authorization header). Remove the GET mutation.
- **Regression test:** With the env unset, an unauthenticated request → 401/503.

### [P1-07] Normal `build` runs `prisma migrate deploy`
- **Confidence:** Confirmed · **Category:** CI/CD / Database
- **Files:** `package.json` L7–8. `vercel.json` L2.
- **Evidence:** `"build": "node scripts/prisma-migrate-deploy.cjs && next build"`, and `vercel.json` uses the same `buildCommand`.
- **Scenario:** Every preview and production build migrates whatever DB its env points at (previews can migrate production if env is shared). A failed `next build` after a successful migrate leaves the schema ahead of the deployed code. There is no approval gate or backup step.
- **Remediation:** Make `build` = `next build`. Run migrations as a separate, gated, backed-up release step.
- **Regression test:** CI asserts that the `build` script contains no `migrate`.

### [P1-08] `.env.example` contains a value shaped like a live SMS API key
- **Confidence:** Needs runtime verification · **Category:** Secrets
- **File:** `.env.example` L46 (`MIM_SMS_API_KEY`), also L47 (sender ID), L113/L116 (admin phone/email PII)
- **Evidence:** Masked shape `AAA9AA9AAAAA9AAAAAA9AAAAA` (25-char random mixed-case alphanumeric). This is not a placeholder. Value redacted.
- **Scenario:** Anyone with repo access can send SMS billed to the account (OTP spoofing/phishing under the brand sender ID).
- **Remediation:** Treat as compromised. Rotate it with the provider and replace it with a placeholder.
- **Regression test:** CI secret scan on `.env.example`.

### [P1-09] Coupon usage limits are check-then-increment (race)
- **Confidence:** Probable (depends on DB isolation) · **Category:** Discounts / Concurrency
- **File:** `app/api/orders/route.ts` L224–247
- **Evidence:** `tx.couponUsage.count(...)` (per-user) and `if (c.usageCount >= c.usageLimit)` (L241), then `increment: 1` (L246). Under PostgreSQL's default READ COMMITTED, concurrent transactions both pass the checks.
- **Scenario:** Parallel checkouts redeem a `usageLimit=1` or once-per-user coupon multiple times.
- **Remediation:** Use a conditional update (`updateMany({ where: { id, usageCount: { lt: usageLimit } } })` and check the count) plus a unique `(couponId, userId)` index for single-use coupons.
- **Regression test:** 10 parallel redemptions of a limit-1 coupon produce exactly 1 success.

### [P1-10] No automated tests and no CI
- **Confidence:** Confirmed · **Category:** Testing / Operations
- **Evidence:** No `test` script in `package.json`. `.github/workflows` is absent. Zero `*.test.*`, `*.spec.*`, vitest, jest, or playwright config files outside `node_modules`.
- **Impact:** None of the above regressions can be prevented automatically.
- **Remediation:** See `TEST_GAP_MATRIX.md` and `RECONSTRUCTION_PLAN.md`.

---

## 6. P2 findings

### [P2-01] Middleware does not cover `/api/admin/*`; some admin GETs are unauthenticated
- **Confidence:** Confirmed
- **Files:** `middleware.ts` L31 (`matcher: ['/admin/:path*', '/dashboard/:path*']`). Unguarded read handlers: `app/api/admin/check-generics/route.ts` L4–6, `app/api/admin/market-intel/route.ts` L18, `app/api/admin/market-intel/comparison/route.ts` L5, `app/api/admin/membership-settings/route.ts` L6 (GET).
- **Scenario:** Anonymous reads of the product list, competitor price intelligence, and trend data. Any future admin route that forgets its guard is fully public.
- **Remediation:** Add `/api/admin/:path*` to the matcher (defense in depth) and add `requireAdmin()` to these handlers.
- **Regression test:** For every `app/api/admin/**` handler, an unauthenticated request returns 401/403 (route inventory test).

### [P2-02] Public GET `/api/seed-blogs` creates or overwrites published blog posts
- **Confidence:** Confirmed · **File:** `app/api/seed-blogs/route.ts` L5, L104, L107
- **Scenario:** Anyone can revert admin edits on four slugs to the seeded content (`status: PUBLISHED`), and prefetchers trigger it too.
- **Remediation:** Delete the route.

### [P2-03] OTP hourly cap is ineffective; no per-IP limit
- **Confidence:** Confirmed · **File:** `lib/auth/otp.ts` L25–34, L52–60, L65
- **Evidence:** `sendOTP` first calls `cleanupExpiredSessions()`, which deletes rows with `expiresAt < now` (TTL 5 min). `enforceRateLimit` then counts the last hour's rows, but rows older than 5 minutes are already gone. The effective limit is 1 per 60s per phone (about 60/hour). There is no per-IP or global limit, and `app/api/auth/otp/send/route.ts` adds none.
- **Scenario:** SMS bombing of one victim (about 60/hour), or cost abuse across many numbers.
- **Remediation:** Don't delete unverified rows younger than 1 hour (or keep a separate counter). Add per-IP and global limits (Upstash).
- **Regression test:** The 6th send for one phone within an hour returns 429.

### [P2-04] `POST /api/auth/otp/verify` returns the full Prisma user, including the password hash
- **Confidence:** Confirmed · **File:** `app/api/auth/otp/verify/route.ts` L31. `lib/auth/otp.ts` L135, L158.
- **Evidence:** `verifyOTP` returns `user` from `findUnique` with no `select`. The route sends `NextResponse.json(result)`, and `User.password` (`schema.prisma` L169) is included.
- **Scenario:** Combined with [P1-03], the victim's browser receives the attacker-set bcrypt hash. An admin who uses OTP receives their own bcrypt hash in the client (cached, logged, extension-readable).
- **Remediation:** Return only `{ isNewUser }`, or a minimal DTO.

### [P2-05] Money stored as `Float`
- **Confidence:** Confirmed · **File:** `prisma/schema.prisma` L567–574 (Order), L619–621 (OrderItem), L310–329 (Product), L415–417 (Variant), L477–484 (Medicine), L642–645 (MembershipPlan), L1152–1153 (DiscountRule), L1174–1176 (Coupon), L1200 (CouponUsage), L1213–1215 (DiscountLog), L1441–1476 (FoodOrder*)
- **Impact:** Rounding drift (the `> 0.02` tolerances at `orders/route.ts` L237/L255 are symptoms); reconciliation mismatch.
- **Remediation:** `Decimal(12,2)` or integer paisa, using a dual-write migration.

### [P2-06] Order number `ORD-${Date.now()}` can collide
- **Confidence:** Confirmed · **Files:** `app/api/orders/route.ts` L207. `app/api/admin/prescriptions/[id]/create-order/route.ts` L148. `schema.prisma` L557 (`@unique`).
- **Scenario:** Two orders in the same millisecond: one fails with a unique violation and a 500, and the client retries.
- **Remediation:** DB sequence or `ORD-YYYYMMDD-<random>` with retry.

### [P2-07] `Order.paymentStatus` is a free-form String with no state machine or audit
- **Confidence:** Confirmed · **Files:** `schema.prisma` L577. `app/api/admin/orders/[id]/payment/route.ts` L55.
- **Remediation:** Enum, transition table, and an append-only `PaymentEvent`/`AuditLog`.

### [P2-08] Admin destructive action via GET (`/api/admin/debug/cleanup-arogga`)
- **Confidence:** Confirmed (code) / Probable (exploit) · **File:** `app/api/admin/debug/cleanup-arogga/route.ts` L5–8, L41
- **Scenario:** A logged-in admin follows an attacker link (top-level GET sends SameSite=Lax cookies) and `product.deleteMany` runs.
- **Remediation:** Remove the debug route, or make it POST with CSRF protection and confirmation.

### [P2-09] Prescription file validation trusts the client MIME type
- **Confidence:** Confirmed · **File:** `lib/supabase.ts` L79–90 (`allowedTypes.includes(file.type)`)
- **Remediation:** Magic-byte sniffing; re-encode images; PDF sanitization or AV scan.

### [P2-10] Supplier inbound auth uses a static bearer with non-constant-time compare and no replay protection
- **Confidence:** Confirmed · **File:** `lib/integrations/azan-inbound-update.ts` L165–169 (`return token === secret`)
- **Remediation:** HMAC signature + timestamp + nonce, `timingSafeEqual`, per-SKU version ordering.

### [P2-11] Weak, word-like `CRON_SECRET` example value
- **Confidence:** Needs runtime verification · **File:** `.env.example` L202
- **Scenario:** If copied verbatim into prod, all six cron routes are callable by anyone who reads the repo.
- **Remediation:** Placeholder only; verify the production value is random (≥32 bytes).

---

## 7. P3 findings

| ID | Finding | File:Line | Confidence |
|---|---|---|---|
| P3-01 | `/api/db-health` public, returns raw DB error message/name | `app/api/db-health/route.ts` L23–28 | Confirmed |
| P3-02 | Public settings GETs lazily `create` a default row (duplicate-row race; mutation via GET) | `app/api/checkout/settings/route.ts` L6–9; `footer/settings` L54–57; `dashboard/settings` L6–9; `order-tracking/settings` L6–9 | Confirmed |
| P3-03 | Auth logs identifier prefixes and user IDs on every login | `lib/auth.ts` L18–60 | Confirmed |
| P3-04 | Emails sent to synthetic `${phone}@example.com` | `app/api/orders/route.ts` L431, L456, L470; `membership/route.ts` L70 | Confirmed |
| P3-05 | OTP HMAC secret falls back to a hard-coded string if both env vars are unset | `lib/auth/otp.ts` L12 | Confirmed (impact low if NEXTAUTH_SECRET set) |
| P3-06 | `OTP_ALLOW_FALLBACK=true` logs the plaintext OTP and allows login without SMS delivery | `lib/auth/otp.ts` L83, L92 | Needs runtime verification (env) |
| P3-07 | Admin `GET /api/prescriptions` returns all prescriptions + phone, unpaginated | `app/api/prescriptions/route.ts` L139–150 | Confirmed |
| P3-08 | 30-day JWT with role baked in; no revocation on role/password change | `lib/auth.config.ts` L6–8, L23–30 | Confirmed |

---

## 8. Authentication and authorization

- **OTP (`lib/auth/otp.ts`):** secure core. `randomInt` 6 digits (L69), HMAC with phone binding (L15–17), `timingSafeEqual` (L19–23), TTL (L119), attempts ≥5 deletes the session (L124–127), wrong code increments attempts (L130–134), `verifiedAt` prevents replay (L115). **No bypass.** Residual issues: P2-03, P2-04, P3-05, P3-06.
- **Password:** bcrypt `compare` (L117 in `lib/auth.ts`). Signup cost 12. Weaknesses: P1-03; no login rate limit (Probable brute-force exposure; needs runtime verification of any edge WAF).
- **Session:** JWT 30d (P3-08). `redirect` callback limited to same-origin (OK).
- **RBAC:** 104 admin routes. 98 have per-handler `auth()`/`requireAdmin()` checks (azan-category-mappings uses a local helper; `subscriptions/[id]` PUT delegates to guarded PATCH). **Unguarded:** `medex-scraper` POST (P1-04), `seed-hygiene-seo` GET (P1-05), `market-intel/sync` GET/POST (P1-06, conditional), `check-generics` GET, `market-intel` GET, `market-intel/comparison` GET, `membership-settings` GET (P2-01). Single role `ADMIN`; no pharmacist/support/catalog separation.
- **Public mutating routes outside `/api/admin`:** `setup-admin` (P0-01), `seed-blogs` (P2-02), `auth/signup` (P1-03), `prescriptions` POST (P0-06), settings lazy-create (P3-02).

## 9. Order / payment / inventory trace

Cart → `POST /api/orders` → `getCheckoutPricingQuote` (server prices ✔, ignores client `price` ✔, **no stock/active filter ✘**) → coupon preview + in-tx recheck (**race ✘**, P1-09) → delivery fee from `cartPageSettings` + zone ✔ → `$transaction` creates order and items (price snapshot ✔, **no stock write ✘**) → **membership activation outside tx regardless of payment ✘** (P0-04) → notifications (errors swallowed ✔) → `processOrderOtp` (errors swallowed ✔) → Azan forward if COD or PAID (best-effort, logged only).

**ONLINE:** `AWAITING_PAYMENT` → (no gateway) → admin PATCH `PAID` → SMS + Azan forward. **No settlement evidence, no audit** (P1-02).

**Membership becomes active:**
1. Immediately on `POST /api/membership` (P0-03).
2. Immediately after order commit for any membership line-item, any payment method (P0-04).
3. Via admin membership routes (guarded).

**Subscriptions** start `pending`/`unpaid` (`app/api/subscriptions/route.ts` L68–74): no finding.

## 10. Prescription privacy

Upload (public, optional session) → MIME-only validation (P2-09) → **public bucket + public URL** (P0-05) → **upsert user by phone** (P0-06) → `Prescription.fileUrl` permanent → admin list unpaginated (P3-07). No consent capture, access audit, retention, or deletion workflow found. **Requires legal/pharmacy-owner review.**

## 11. Database and migrations

Float money (P2-05). String payment status (P2-07). `Prescription.status` and `Subscription.status`/`paymentStatus`/`paymentMethod` are free-form strings (L532, L704–706). `OtpSession` well-indexed (L194–195). Build-time migrate (P1-07). `scripts/prisma-migrate-deploy.cjs` contains a hard-coded "stuck migration" workaround, which shows prior drift (needs runtime verification of `_prisma_migrations`).

## 12. Upload and integration security

- Prescriptions: P0-05, P0-06, P2-09.
- Medex scraper SSRF: P1-04.
- Supplier inbound: P2-10.
- `image-proxy`: host-allowlisted with exact hostname match via `new URL()` (OK).
- Cron routes use `requireCronAuth` (Bearer, fails closed if unset): OK, subject to P2-11.

## 13. Frontend / accessibility

Checkout presents bKash/Nagad as a selectable payment that the system cannot process (P1-02, misleading claim). A11y, hydration, and mobile layout were **not** runtime-tested in this pass.

## 14. SEO / content / privacy

`seed-hygiene-seo` and `seed-blogs` allow anonymous content/SEO mutation (P1-05, P2-02). Tracking-pixel PII flow not verified (runtime).

## 15. Performance / reliability

Unpaginated `findMany` on orders (`orders/route.ts` L522) and prescriptions (L139). Medex scraper `fetch` has no timeout. Notifications awaited inline (latency, not failure).

## 16. Testing / CI/CD / operations

No tests, no CI, no secret scanning, migrations in build, no audit/payment/inventory ledgers, no reconciliation jobs.

## 17. Feature readiness matrix

| Feature | Readiness |
|---|---|
| OTP login | Partially ready |
| Password login / signup | Unsafe |
| Admin bootstrap | Unsafe |
| Admin API authorization | Partially ready |
| Catalog / pricing quote | Partially ready |
| Orders (COD) | Partially ready |
| Orders (ONLINE) | Missing |
| Payment gateway / reconciliation | Missing |
| Membership purchase | Unsafe |
| Subscriptions | Partially ready |
| Coupons | Partially ready |
| Inventory control | Missing |
| Supplier inbound sync | Partially ready |
| Supplier order forwarding | Unknown |
| Prescription upload/storage | Unsafe |
| Market intel / scrapers | Unsafe |
| Blog/SEO seeding | Unsafe |
| Cron jobs | Partially ready |
| Tests / CI | Missing |
| Audit logging | Missing |

## 18. Unknowns requiring production access

1. Is `GET /api/setup-admin` reachable on the deployed site, and has it been called? (Check Vercel logs; check `User` rows with `role=ADMIN` and their `updatedAt`.)
2. Is the Supabase `healthplus` bucket currently public? How many prescription objects exist?
3. Is the `.env.example` `MIM_SMS_API_KEY` value live?
4. Is `MARKET_INTEL_CRON_SECRET` set in every environment? Is `CRON_SECRET` the example value?
5. Is `OTP_ALLOW_FALLBACK` set in production?
6. Do preview deployments share the production `DATABASE_URL` (P1-07 blast radius)?
7. `_prisma_migrations` drift state.
8. Have memberships been created without corresponding paid orders? (Query `UserMembership` vs `Order`.)

## 19. Recommended next actions

1. **Today:** delete `setup-admin`, `seed-blogs`, and `seed-hygiene-seo`. Guard `medex-scraper` and `market-intel/*`. Rotate the admin password, MIM SMS key, and `CRON_SECRET`. Revoke admin sessions by rotating `NEXTAUTH_SECRET`.
2. Disable `POST /api/membership` and membership line-items. Hide the ONLINE payment option.
3. Make the prescription bucket private and switch to signed URLs. Stop phone-based guest binding.
4. Remove `migrate deploy` from `build`.
5. Then follow `RECONSTRUCTION_PLAN.md`.
