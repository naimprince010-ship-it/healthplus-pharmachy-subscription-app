import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rebuild-product-cooccurrence', () => ({
  rebuildProductCooccurrence: vi.fn(async () => ({ success: true, pairCount: 0 })),
}))
vi.mock('@/lib/flash-sale-engine', () => ({
  runFlashSaleAutoRotation: vi.fn(async () => ({})),
}))
vi.mock('@/lib/facebook-marketing', () => ({
  isFacebookMarketingConfigured: vi.fn(() => true),
  runFacebookMarketingJob: vi.fn(async () => ({ success: true })),
}))
vi.mock('@/lib/discount-engine', () => ({
  runDiscountEngine: vi.fn(async () => ({
    success: true,
    rulesProcessed: 0,
    productsUpdated: 0,
    productsCleared: 0,
    errors: [],
  })),
}))
vi.mock('@/lib/market-intel/sync', () => ({
  runMarketIntelSync: vi.fn(async () => ({
    success: true,
    inserted: 0,
    timestamp: new Date(0),
    logId: 'test-log',
  })),
}))

const cronRoutes = [
  ['rebuild-product-cooccurrence', () => import('@/app/api/cron/rebuild-product-cooccurrence/route')],
  ['flash-rotation', () => import('@/app/api/cron/flash-rotation/route')],
  ['facebook-marketing', () => import('@/app/api/cron/facebook-marketing/route')],
  ['discount-engine', () => import('@/app/api/cron/discount-engine/route')],
  ['market-intel', () => import('@/app/api/cron/market-intel/route')],
] as const

function request(path: string, authorization?: string) {
  return new NextRequest(`http://localhost/api/cron/${path}`, {
    headers: authorization ? { authorization } : undefined,
  })
}

describe('cron route authorization', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  for (const [path, load] of cronRoutes) {
    it(`${path} fails closed when CRON_SECRET is missing`, async () => {
      delete process.env.CRON_SECRET
      const { GET } = await load()

      expect((await GET(request(path))).status).toBe(503)
      expect((await GET(request(path, 'Bearer undefined'))).status).toBe(503)
    })

    it(`${path} rejects an invalid bearer token`, async () => {
      const { GET } = await load()
      expect((await GET(request(path, 'Bearer wrong'))).status).toBe(401)
    })

    it(`${path} accepts the configured bearer token`, async () => {
      const { GET } = await load()
      expect((await GET(request(path, 'Bearer test-cron-secret'))).status).toBe(200)
    })
  }
})
