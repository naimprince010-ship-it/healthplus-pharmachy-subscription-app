/**
 * Vercel/CI only: runs `prisma migrate deploy`.
 *
 * Supabase **transaction pooler** (:6543 on *.pooler.supabase.com) often stalls migrations.
 * Prefer DIRECT_* env; otherwise derive direct Postgres (:5432, db.[ref]) when DATABASE_URL uses
 * user `postgres.[project-ref]` (Supabase’s default pooled string).
 */
const { spawnSync } = require('node:child_process')

/** @returns {string | null} */
function deriveDirectFromSupabasePooler(cs) {
  if (!cs || typeof cs !== 'string') return null

  let u
  try {
    u = new URL(cs.trim())
  } catch {
    return null
  }

  if (!u.hostname.includes('.pooler.supabase.com') || u.port !== '6543') return null

  const userPart = decodeURIComponent(u.username || '')
  const m = /^postgres\.([a-zA-Z0-9]+)$/.exec(userPart)
  if (!m) return null

  const ref = m[1]
  const password = decodeURIComponent(u.password || '')
  const pathname = u.pathname || '/postgres'

  const out = new URL('postgresql://x')
  out.protocol = 'postgresql:'
  out.username = 'postgres'
  out.password = password
  out.hostname = `db.${ref}.supabase.co`
  out.port = '5432'
  out.pathname = pathname
  const sp = new URLSearchParams(u.searchParams)
  if (!sp.has('sslmode')) sp.set('sslmode', 'require')
  out.search = sp.toString()

  try {
    return out.toString()
  } catch {
    return null
  }
}

const explicitDirect =
  process.env.DIRECT_URL ||
  process.env.DATABASE_DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING

const pooled = process.env.DATABASE_URL || ''

let migrateUrl = explicitDirect
if (!migrateUrl) {
  migrateUrl = deriveDirectFromSupabasePooler(pooled)
  if (migrateUrl) {
    console.log('\nprisma-migrate-deploy: derived direct DB URL db.*:5432 for migrations.\n')
  }
}

if (migrateUrl) {
  process.env.DATABASE_URL = migrateUrl
} else if (/pooler\.supabase\.com:6543/.test(pooled)) {
  console.warn(
    '\n⚠ prisma-migrate-deploy: pool :6543 without DIRECT_URL — use DATABASE_URL user `postgres.[project-ref]` or set DIRECT_URL.\n'
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
