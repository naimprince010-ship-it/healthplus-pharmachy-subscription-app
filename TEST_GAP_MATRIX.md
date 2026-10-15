# TEST_GAP_MATRIX — HALALZI `main` @ 6de2235

Current state: **no test runner, no test files, no CI workflow** (verified: no `test` script in `package.json`, no `.github/workflows`, 0 `*.test.*`/`*.spec.*`/vitest/jest/playwright configs outside `node_modules`). Root-level `test-*.ts` and `scripts/test-hash.*` are manual scripts, not assertions.

| ID | Finding | Required automated test | Type | Priority |
|---|---|---|---|---|
| T-01 | P0-01 | `/api/setup-admin` returns 404. No unauthenticated handler can write `role: ADMIN` | Route inventory + integration | P0 |
| T-02 | P0-02 | gitleaks scan on every PR fails on committed credentials/hashes/PII | CI security | P0 |
| T-03 | P0-03 | `POST /api/membership` without settled payment → no `isActive` membership | Integration | P0 |
| T-04 | P0-04 | ONLINE order with membership item → membership inactive until verified PAID | Integration | P0 |
| T-05 | P0-04 | Injected failure after order tx → no partial membership; retry does not duplicate order | Integration | P0 |
| T-06 | P0-05 | Stored prescription object not fetchable via public URL. Authorized read returns expiring signed URL | Integration (Supabase test project) | P0 |
| T-07 | P0-06 | Unauthenticated upload with an existing user's phone does not attach to that user | Integration | P0 |
| T-10 | P1-01 | 10 parallel orders vs stock=1 → exactly 1 success; stock ≥ 0; cancel restores once | Concurrency | P1 |
| T-11 | P1-01 | Inactive / out-of-stock product rejected by pricing quote | Unit | P1 |
| T-12 | P1-02 | ONLINE order cannot be forwarded or fulfilled without a verified payment event. Manual PAID requires reference + audit row | Integration/E2E | P1 |
| T-13 | P1-03 | Signup cannot create a password account on an unverified phone. Prior password invalid after first OTP login | Integration | P1 |
| T-14 | P1-04 | `medex-scraper`: unauthenticated → 401; `http://evil/?medex.com.bd` → 400 | Integration | P1 |
| T-15 | P1-05 / P2-02 | No route exports a GET that performs Prisma writes (static lint/AST check) | Static | P1 |
| T-16 | P1-06 | `market-intel/sync` with env unset and no auth → 401/503 | Integration | P1 |
| T-17 | P1-07 | `package.json` build script contains no `migrate` | Static/CI | P1 |
| T-18 | P1-08 / P2-11 | `.env.example` values are placeholders only (regex check) | Static/CI | P1 |
| T-19 | P1-09 | 10 parallel redemptions of a limit-1 coupon → 1 success | Concurrency | P1 |
| T-20 | P2-01 | Every `app/api/admin/**` handler returns 401/403 without an admin session | Route inventory | P2 |
| T-21 | P2-03 | 6th OTP send in 1 hour for the same phone → 429; per-IP cap enforced | Integration | P2 |
| T-22 | P2-04 | OTP verify response contains no `password` field | Unit | P2 |
| T-23 | P2-05 | Money columns are Decimal; totals exact to 2 dp | Schema + unit | P2 |
| T-24 | P2-06 | Parallel order creation yields unique order numbers, no 500 | Concurrency | P2 |
| T-25 | P2-07 | Illegal payment-status transitions rejected | Unit | P2 |
| T-26 | P2-08 | Destructive admin endpoints reject GET | Route inventory | P2 |
| T-27 | P2-09 | Spoofed MIME (EXE renamed .pdf) rejected | Unit | P2 |
| T-28 | P2-10 | Replayed or stale supplier update rejected; secret compare is constant-time | Unit/integration | P2 |
| T-30 | OTP core (regression guard) | Wrong code rejected; 5 failures lock session; expired rejected; verified session cannot be reused | Unit | P1 |

## Tooling to add
1. Vitest (unit/integration) with a disposable Postgres (Docker or Supabase branch).
2. Playwright for checkout, OTP login, and prescription upload E2E.
3. GitHub Actions: `tsc --noEmit`, `eslint`, tests, `prisma validate`, gitleaks, `npm audit`. Required on `main`.
4. Concurrency harness (parallel `fetch` against a test server) for T-10, T-19, T-24.
