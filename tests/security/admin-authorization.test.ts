import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  session: null as unknown,
  dbAccess: [] as string[],
  fetchCalls: [] as string[],
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(async () => h.session),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}))

vi.mock('@/lib/prisma', () => {
  const prisma = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return undefined
        h.dbAccess.push(String(prop))
        throw new Error(`Database access to "${String(prop)}" is not allowed`)
      },
    }
  )
  return { prisma, default: prisma }
})

vi.mock('@/lib/market-intel/sync', () => ({
  runMarketIntelSync: vi.fn(async () => ({ success: true, inserted: 1, timestamp: new Date(0), logId: 'log_1' })),
  getRecentSyncLogs: vi.fn(async () => []),
}))

vi.mock('next-auth', () => ({
  default: () => ({ auth: (handler: unknown) => handler }),
}))

const ROOT = path.resolve(__dirname, '..', '..')
const ADMIN_API_DIR = path.join(ROOT, 'app', 'api', 'admin')
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

const adminRouteFiles = (fs.readdirSync(ADMIN_API_DIR, { recursive: true }) as string[])
  .filter((rel) => path.basename(rel) === 'route.ts')
  .map((rel) => rel.replace(/\\/g, '/'))
  .sort()

const params = Promise.resolve(new Proxy({}, { get: (_t, key) => (key === 'then' ? undefined : 'test-id') }))

function requestFor(rel: string, method: string) {
  const url = `http://localhost/api/admin/${path.posix.dirname(rel)}`
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'GET' || method === 'DELETE' ? undefined : '{}',
  })
}

beforeEach(() => {
  h.dbAccess.length = 0
  h.fetchCalls.length = 0
  vi.stubGlobal('fetch', vi.fn(async (input: unknown) => {
    h.fetchCalls.push(String(input))
    throw new Error('Network access is not allowed in tests')
  }))
  process.env.MARKET_INTEL_CRON_SECRET = 'test-market-intel-secret'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.MARKET_INTEL_CRON_SECRET
})

describe.skip('every /api/admin handler rejects non-admin callers (manual exhaustive probe; too memory-intensive for CI)', () => {
  it('discovers the admin route inventory', () => {
    expect(adminRouteFiles.length).toBeGreaterThan(90)
    expect(adminRouteFiles).not.toContain('seed-hygiene-seo/route.ts')
    expect(adminRouteFiles).not.toContain('debug/cleanup-arogga/route.ts')
  })

  for (const rel of adminRouteFiles) {
    it(`/api/admin/${path.posix.dirname(rel)}`, async () => {
      const mod = (await import(path.join(ADMIN_API_DIR, rel))) as Record<string, unknown>
      const handlers = METHODS.filter((m) => typeof mod[m] === 'function')
      expect(handlers.length, 'route exports at least one HTTP handler').toBeGreaterThan(0)

      for (const [label, session] of [
        ['anonymous', null],
        ['customer', { user: { id: 'customer_1', role: 'USER' } }],
      ] as const) {
        for (const method of handlers) {
          h.session = session
          const handler = mod[method] as (req: NextRequest, ctx: unknown) => Promise<Response>
          const res = await handler(requestFor(rel, method), { params })
          expect([401, 403], `${label} ${method} status`).toContain(res.status)
        }
      }

      expect(h.dbAccess, 'no database access before authorization').toEqual([])
      expect(h.fetchCalls, 'no outbound requests before authorization').toEqual([])
    })
  }
})

describe('middleware protects /api/admin', () => {
  async function runMiddleware(pathname: string, session: unknown, headers: Record<string, string> = {}) {
    const { default: middleware } = (await import('@/middleware')) as unknown as {
      default: (req: unknown) => Response | undefined
    }
    const url = new URL(`http://localhost${pathname}`)
    return middleware({ auth: session, nextUrl: url, url: url.toString(), headers: new Headers(headers) })
  }

  it('matcher covers /api/admin routes', async () => {
    const { config } = await import('@/middleware')
    expect(config.matcher).toEqual(expect.arrayContaining(['/api/admin/:path*']))
  })

  it('rejects anonymous API calls with 401 JSON (no redirect)', async () => {
    const res = await runMiddleware('/api/admin/orders', null)
    expect(res?.status).toBe(401)
  })

  it('rejects customers with 403', async () => {
    const res = await runMiddleware('/api/admin/orders', { user: { id: 'c', role: 'USER' } })
    expect(res?.status).toBe(403)
  })

  it('lets admins through', async () => {
    const res = await runMiddleware('/api/admin/orders', { user: { id: 'a', role: 'ADMIN' } })
    expect(res?.headers.get('x-middleware-next')).toBe('1')
  })

  it('does not let a bearer header bypass the session check on ordinary admin APIs', async () => {
    const res = await runMiddleware('/api/admin/orders', null, { authorization: 'Bearer anything' })
    expect(res?.status).toBe(401)
  })
})

describe('/api/admin/market-intel/sync', () => {
  const load = () => import('@/app/api/admin/market-intel/sync/route')

  it('fails closed (503) when MARKET_INTEL_CRON_SECRET is missing', async () => {
    delete process.env.MARKET_INTEL_CRON_SECRET
    h.session = null
    const { GET, POST } = await load()
    expect((await GET(new NextRequest('http://localhost/api/admin/market-intel/sync'))).status).toBe(503)
    expect((await POST(new NextRequest('http://localhost/api/admin/market-intel/sync', { method: 'POST' }))).status).toBe(503)
  })

  it('never accepts the secret from the query string', async () => {
    h.session = null
    const { GET } = await load()
    const res = await GET(new NextRequest('http://localhost/api/admin/market-intel/sync?token=test-market-intel-secret'))
    expect(res.status).toBe(401)
  })

  it('accepts the secret only via Authorization: Bearer', async () => {
    h.session = null
    const { GET } = await load()
    const res = await GET(
      new NextRequest('http://localhost/api/admin/market-intel/sync', {
        headers: { authorization: 'Bearer test-market-intel-secret' },
      })
    )
    expect(res.status).toBe(200)
  })

  it('GET ignores an admin session cookie (no cookie-authenticated GET mutation)', async () => {
    h.session = { user: { id: 'a', role: 'ADMIN' } }
    const { GET } = await load()
    expect((await GET(new NextRequest('http://localhost/api/admin/market-intel/sync'))).status).toBe(401)
  })

  it('POST works for an admin session (admin UI)', async () => {
    h.session = { user: { id: 'a', role: 'ADMIN' } }
    const { POST } = await load()
    expect((await POST(new NextRequest('http://localhost/api/admin/market-intel/sync', { method: 'POST' }))).status).toBe(200)
  })
})

describe('medex-scraper URL allowlist (SSRF)', () => {
  it('accepts only https medex.com.bd hosts', async () => {
    const { parseMedexUrl } = await import('@/lib/security/medex-url')
    expect(parseMedexUrl('https://medex.com.bd/brands/123/napa')).not.toBeNull()
    expect(parseMedexUrl('https://www.medex.com.bd/generics/1')).not.toBeNull()
    for (const bad of [
      'http://medex.com.bd/brands/1',
      'https://evil.example/?medex.com.bd',
      'https://medex.com.bd.evil.example/',
      'https://evil.example/#medex.com.bd',
      'https://user:pass@medex.com.bd/',
      'https://medex.com.bd:8443/',
      'http://169.254.169.254/latest/meta-data?medex.com.bd',
      'not a url',
      42,
    ]) {
      expect(parseMedexUrl(bad), String(bad)).toBeNull()
    }
  })
})
