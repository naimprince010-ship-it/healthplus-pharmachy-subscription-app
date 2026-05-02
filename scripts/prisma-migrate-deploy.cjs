/**
 * Vercel/CI only: runs `prisma migrate deploy`.
 *
 * Supabase transaction pool (:6543) stalls migrations → use **session pool** on same
 * *.pooler.supabase.com host, port **5432** (IPv4-friendly).
 *
 * Avoid `db.*.supabase.co:5432` for migrate on Vercel — often IPv6-only → P1001.
 * @see https://supabase.com/docs/guides/troubleshooting/prisma-error-management
 */
const { spawnSync } = require('node:child_process')

/** @returns {string | null} */
function deriveSessionPoolerMigrateUrl(transactionPoolCs) {
  if (!transactionPoolCs || typeof transactionPoolCs !== 'string') return null

  let u
  try {
    u = new URL(transactionPoolCs.trim())
  } catch {
    return null
  }

  if (!u.hostname.includes('.pooler.supabase.com') || u.port !== '6543') return null

  const userPart = decodeURIComponent(u.username || '')
  if (!/^postgres\.[a-zA-Z0-9]+$/.test(userPart)) return null

  const out = new URL(u.toString())
  out.port = '5432'

  const sp = new URLSearchParams(u.searchParams)
  sp.delete('pgbouncer')
  sp.delete('connection_limit')
  if (!sp.has('sslmode')) sp.set('sslmode', 'require')
  if (!sp.has('connect_timeout')) sp.set('connect_timeout', '30')
  out.search = sp.toString()

  try {
    return out.toString()
  } catch {
    return null
  }
}

/** `db.PROJECT.supabase.co` is often unreachable from IPv4-only build runners */
function isSupabaseDirectDbHost(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false
  try {
    const h = new URL(urlStr.trim()).hostname
    return /^db\.[^.]+\.supabase\.co$/i.test(h)
  } catch {
    return false
  }
}

const explicitDirect =
  process.env.DIRECT_URL ||
  process.env.DATABASE_DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING

const pooled = process.env.DATABASE_URL || ''

const derivedSession = deriveSessionPoolerMigrateUrl(pooled)

let migrateUrl = null
if (derivedSession) {
  migrateUrl = derivedSession
  if (explicitDirect && isSupabaseDirectDbHost(explicitDirect)) {
    console.log(
      '\nprisma-migrate-deploy: using session pooler :5432 from DATABASE_URL (Vercel/IPv4). ' +
        'Ignoring DIRECT_URL pointing at db.*.supabase.co.\n'
    )
  } else {
    console.log('\nprisma-migrate-deploy: using Supabase session pooler :5432 for migrations.\n')
  }
} else if (explicitDirect) {
  migrateUrl = explicitDirect
} else if (/pooler\.supabase\.com:6543/.test(pooled)) {
  console.warn(
    '\n⚠ prisma-migrate-deploy: pool :6543 but could not derive session URL — use user `postgres.[project-ref]` on DATABASE_URL.\n'
  )
}

if (migrateUrl) {
  process.env.DATABASE_URL = migrateUrl
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
