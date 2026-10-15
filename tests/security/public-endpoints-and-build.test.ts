import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '..', '..')
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel))

describe('removed public bootstrap / seed / debug endpoints', () => {
  it.each([
    'app/api/setup-admin',
    'app/api/seed-blogs',
    'app/api/admin/seed-hygiene-seo',
    'app/api/admin/debug/cleanup-arogga',
  ])('%s is absent', (dir) => {
    expect(exists(`${dir}/route.ts`)).toBe(false)
    expect(exists(`${dir}/route.js`)).toBe(false)
  })

  it('no route handler writes role ADMIN', () => {
    const offenders = (fs.readdirSync(path.join(ROOT, 'app', 'api'), { recursive: true }) as string[])
      .filter((rel) => path.basename(rel) === 'route.ts')
      .filter((rel) => /role:\s*['"]ADMIN['"]/.test(read(path.join('app', 'api', rel))))
    expect(offenders).toEqual([])
  })

  it.each(['scripts/set-admin.ts', 'scripts/test-hash.ts', 'scripts/test-hash.js'])(
    'credential-bearing script %s is removed',
    (rel) => expect(exists(rel)).toBe(false)
  )
})

describe('build scripts never run database migrations', () => {
  const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }
  const vercel = JSON.parse(read('vercel.json')) as { buildCommand?: string }
  const migrates = /migrate|prisma-migrate-deploy|db\s+push/i

  it.each(['build', 'vercel:build', 'prebuild', 'postbuild'])('package.json "%s"', (name) => {
    expect(pkg.scripts[name] ?? '').not.toMatch(migrates)
  })

  it('vercel.json buildCommand', () => {
    expect(vercel.buildCommand ?? '').not.toMatch(migrates)
  })

  it('migration release script refuses to run without explicit approval', () => {
    const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test' }
    delete env.MIGRATION_RELEASE_APPROVED
    const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'prisma-migrate-deploy.cjs')], {
      env,
      encoding: 'utf8',
      timeout: 30_000,
    })
    expect(result.status).not.toBe(0)
    expect(`${result.stderr}${result.stdout}`).toContain('MIGRATION_RELEASE_APPROVED')
  })
})

describe('checkout offers Cash on Delivery only', () => {
  const page = read('app/(site)/checkout/page.tsx')

  it('has no bKash / ONLINE selection path', () => {
    expect(page).not.toMatch(/setPaymentMethod\(\s*['"](BKASH|ONLINE)['"]\s*\)/)
    expect(page).not.toMatch(/['"]ONLINE['"]/)
    expect(page).toMatch(/useState<'COD'>\('COD'\)/)
  })
})

describe('.env.example contains placeholders only', () => {
  const env = read('.env.example')
  const value = (key: string) => new RegExp(`^${key}=\"?([^\"\\r\\n]*)`, 'm').exec(env)?.[1] ?? ''

  it.each([
    'MIM_SMS_API_KEY',
    'MIM_SMS_SENDER_ID',
    'SMS_API_KEY',
    'CRON_SECRET',
    'NEXTAUTH_SECRET',
    'DEFAULT_ADMIN_PASSWORD',
    'DEFAULT_ADMIN_PHONE',
    'DEFAULT_ADMIN_EMAIL',
  ])('%s is an obvious placeholder', (key) => {
    const v = value(key)
    expect(v === '' || /your|example|placeholder|generate|change|X{4,}/i.test(v), key).toBe(true)
  })
})
