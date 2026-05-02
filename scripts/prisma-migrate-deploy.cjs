/**
 * Vercel/CI only: runs `prisma migrate deploy`.
 *
 * Supabase **transaction pooler** (:6543, host like *.pooler.supabase.com) breaks or stalls
 * `migrate deploy` (advisory locks / session semantics). Prefer a **direct** Postgres URL or
 * **session** pooler for this step via DIRECT_URL — see `.env.example`.
 */
const { spawnSync } = require('node:child_process')

const direct =
  process.env.DIRECT_URL ||
  process.env.DATABASE_DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING

const pooled = process.env.DATABASE_URL || ''

if (direct) {
  process.env.DATABASE_URL = direct
} else if (/pooler\.supabase\.com:6543/.test(pooled)) {
  console.warn(
    '\n⚠ prisma-migrate-deploy: DATABASE_URL is Supabase transaction pool (:6543). ' +
      'Set DIRECT_URL in Vercel (Supabase → Connect → Postgres → URI, Direct or Session) ' +
      'or builds can hang.\n'
  )
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status === null ? 1 : result.status)
