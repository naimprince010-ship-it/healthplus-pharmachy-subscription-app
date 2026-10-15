# SECURITY_ROTATION_CHECKLIST — Release 0 containment

Branch: `codex/p0-security-containment` (from `main` @ `6de2235`).
No secret values appear in this document. "Exposed at" refers to `main` @ `6de2235`. Every value below also remains in **git history** (history was not rewritten in this pass), so treat each one as compromised even after the working-tree copies were removed.

## 1. Credentials the owner must rotate externally

| # | Credential | Exposed at (now removed/redacted on this branch) | Action | Done when |
|---|---|---|---|---|
| R1 | Admin account password (owner's admin login) | `app/api/setup-admin/route.ts` L8, `scripts/set-admin.ts` L8, `scripts/test-hash.ts` L4, `scripts/test-hash.js` L4 (plaintext + bcrypt hash) | Set a new strong, unique password for every ADMIN user. Also change it anywhere else the same password is reused (email, hosting, registrar). | Old password rejected at `/auth/signin` |
| R2 | Password variant labelled "database password" | `docs/AUTH_FIX_SUMMARY.md` L323 | Rotate the Supabase database password. Update `DATABASE_URL`/`DIRECT_URL` in every Vercel environment and locally. | Old DB password rejected by Supabase |
| R3 | Azan Wholesale supplier portal login (phone + password) | `scripts/scrape-azan.mjs` L21–22 | Change the portal password. The script now reads `AZAN_PORTAL_PHONE` / `AZAN_PORTAL_PASSWORD` from env; keep them only in a local, untracked env. | Old password rejected by the portal |
| R4 | MIM SMS API key | `.env.example` L46 (non-placeholder, key-shaped value) | Revoke/regenerate in the MIM SMS dashboard. Set the new key only in Vercel env. Review SMS usage logs for unknown sends. | Old key rejected by provider |
| R5 | `CRON_SECRET` | `.env.example` L202 (word-like example value) | If production uses that value (or anything weak), replace it with ≥32 random bytes (`openssl rand -base64 32`) in Vercel. | Cron routes reject the old value |
| R6 | `NEXTAUTH_SECRET` | Not committed. Rotate anyway: anyone who called the public `setup-admin` route could hold a valid 30-day admin JWT. | Generate a new secret in all Vercel environments. This signs every user out. | Old sessions rejected |
| R7 | `OTP_HASH_SECRET` | Not set → falls back to `NEXTAUTH_SECRET` or a hard-coded string (`lib/auth/otp.ts` L12) | Set a dedicated random value in every environment. | Env var present in Vercel |
| R8 | `MARKET_INTEL_CRON_SECRET` | Previously optional and accepted via `?token=` query string (could appear in access logs) | Set a strong value in Vercel. Update any external scheduler to send `Authorization: Bearer <secret>`. Query-string tokens are now rejected. | Sync rejects query tokens; scheduler succeeds with header |
| R9 | Example admin password in docs | `docs/AUTH_FLOW.md` L1216, L1233 | If this string was ever used for a real account, rotate it as in R1. | Confirmed unused or rotated |

Exposed personal data (cannot be rotated; note for privacy review): the admin's email address and phone number appeared in `app/api/setup-admin/route.ts`, `scripts/set-admin.ts` and `.env.example`, and a supplier-portal phone number appeared in `scripts/scrape-azan.mjs`.

## 2. External production actions (not performed from local code)

| # | Action | Why | How to verify |
|---|---|---|---|
| X1 | **Set the Supabase `healthplus` storage bucket to private** (Dashboard → Storage → bucket settings). | Prescriptions were stored with permanent public URLs (audit P0-05). The code now stores object paths and serves 10-minute signed URLs, and works with both public and private buckets. | `curl -I https://<project>.supabase.co/storage/v1/object/public/healthplus/prescriptions/<existing-file>` returns 400/404. The admin prescription view still opens files. |
| X2 | Check whether `GET /api/setup-admin` was ever called. | It reset/created an ADMIN account with the committed password. | Vercel logs for `/api/setup-admin`. Check `User` rows with `role = 'ADMIN'` and their `updatedAt`. Remove unknown admins. |
| X3 | Review accounts possibly pre-registered by phone without OTP. | Signup previously accepted any phone (audit P1-03). | Query users with a non-empty `password` whose phone owner never registered one. Clear those passwords and require OTP. |
| X4 | Review prescriptions possibly attached to the wrong account. | Guest uploads were previously bound to any account by phone (audit P0-06). | Prescriptions whose `userId` owner did not upload them (support review). |
| X5 | Review memberships granted without payment. | `POST /api/membership` and order membership items activated without settlement (P0-03/P0-04). | `UserMembership` rows lacking a matching paid/delivered order. |
| X6 | Confirm the deployment no longer migrates during build. | `build` now runs only `next build`. | Vercel build logs show no `prisma migrate deploy`. Run migrations only via `MIGRATION_RELEASE_APPROVED=true npm run db:migrate:release`. |
| X7 | Purge secrets from git history (later, coordinated). | Values remain in history. | `git filter-repo` plus a coordinated force-push. Collaborators re-clone. Re-run a secret scan. |
| X8 | Confirm preview deployments use a non-production `DATABASE_URL`. | Limits the blast radius of previews. | Vercel env settings per environment. |
| X9 | Confirm `OTP_ALLOW_FALLBACK` is unset/false in production. | When true, OTPs are logged and login proceeds without SMS. | Vercel env settings. |

## 3. Order of operations

1. R6 (`NEXTAUTH_SECRET`) and R1 (admin password) immediately after deploying this branch.
2. X1 (bucket private) right after deployment, then verify the admin prescription viewer.
3. R2, R3, R4, R5, R7, R8.
4. X2–X5 investigations; X8, X9 configuration checks.
5. X7 history purge once all values are rotated.
