import { beforeEach, describe, expect, it, vi } from 'vitest'
import { customerSession, jsonRequest } from '../helpers'

const h = vi.hoisted(() => ({
  session: null as unknown,
  orderCreates: [] as Record<string, unknown>[],
  membershipWrites: [] as string[],
  forwarded: [] as string[],
  stockClaims: [] as Record<string, unknown>[],
  stockAvailable: true,
  existingOrder: null as null | Record<string, unknown>,
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => h.session) }))

vi.mock('@/lib/prisma', () => {
  const membershipGuard = (op: string) =>
    vi.fn(async () => {
      h.membershipWrites.push(op)
      throw new Error('userMembership must not be written')
    })
  const stockDelegate = {
    updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      h.stockClaims.push({ where, data })
      const stockMutation = data.stockQuantity as { decrement?: number } | undefined
      return { count: stockMutation?.decrement && !h.stockAvailable ? 0 : 1 }
    }),
  }
  const tx = {
    $executeRaw: vi.fn(async () => 1),
    medicine: stockDelegate,
    product: stockDelegate,
    coupon: { findUnique: vi.fn(), update: vi.fn() },
    couponUsage: { count: vi.fn(async () => 0), create: vi.fn() },
    order: {
      findFirst: vi.fn(async () => h.existingOrder),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        h.orderCreates.push(data)
        return {
          id: 'order_1',
          orderNumber: data.orderNumber,
          total: data.total,
          paymentStatus: data.paymentStatus,
          user: { name: 'Customer', phone: '+8801711111111' },
          items: [],
        }
      }),
    },
  }
  const prisma = {
    order: { findFirst: vi.fn(async () => h.existingOrder) },
    address: {
      findUnique: vi.fn(async () => ({
        id: 'addr_1',
        userId: 'customer_1',
        zoneId: 'zone_1',
        phone: '+8801711111111',
        zone: { name: 'Dhaka', deliveryDays: '1-2' },
      })),
    },
    cartPageSettings: { findFirst: vi.fn(async () => ({ freeDeliveryThreshold: 499 })) },
    userMembership: {
      create: membershipGuard('create'),
      update: membershipGuard('update'),
      upsert: membershipGuard('upsert'),
      findFirst: vi.fn(async () => null),
    },
    membershipPlan: { findUnique: vi.fn(async () => ({ id: 'plan_1', isActive: true, durationDays: 30 })) },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  }
  return { prisma }
})

vi.mock('@/lib/order-pricing-quote', () => ({
  getCheckoutPricingQuote: vi.fn(async ({ items }: { items: { productId?: string; quantity: number }[] }) => ({
    ok: true,
    medicines: [],
    products: [{ id: 'prod_1', sellingPrice: 100, category: null }],
    membershipPlans: [],
    regularItems: items,
    membershipItems: [],
    regularSubtotal: 100,
    membershipTotal: 0,
    subtotal: 100,
    membershipDiscount: 0,
    eligibleForCoupon: 100,
    activeMembership: null,
  })),
}))

vi.mock('@/lib/delivery-charge', () => ({ resolveDeliveryChargeByZoneName: vi.fn(() => 60) }))
vi.mock('@/lib/notifications', () => ({ sendSMS: vi.fn(async () => true), sendEmail: vi.fn(async () => true) }))
vi.mock('@/lib/settings/server', () => ({ processOrderOtp: vi.fn(async () => undefined) }))
vi.mock('@/lib/integrations/forward-order-to-azan', () => ({
  forwardOrderToAzanById: vi.fn(async (id: string) => {
    h.forwarded.push(id)
    return { lineCount: 1 }
  }),
}))

const productLine = { productId: 'prod_1', quantity: 1, price: 100 }
const membershipLine = { membershipPlanId: 'plan_1', quantity: 1, price: 99 }

async function postOrder(body: Record<string, unknown>) {
  const { POST } = await import('@/app/api/orders/route')
  return POST(jsonRequest('/api/orders', 'POST', body, { 'idempotency-key': 'checkout_request_1234567890' }))
}

beforeEach(() => {
  h.session = customerSession
  h.orderCreates.length = 0
  h.membershipWrites.length = 0
  h.forwarded.length = 0
  h.stockClaims.length = 0
  h.stockAvailable = true
  h.existingOrder = null
})

describe('membership cannot activate without settlement', () => {
  it('POST /api/membership is disabled and writes nothing', async () => {
    const { POST } = await import('@/app/api/membership/route')
    const res = await (POST as unknown as (req: unknown) => Promise<Response>)(
      jsonRequest('/api/membership', 'POST', { planId: 'plan_1' })
    )
    expect(res.status).toBe(503)
    expect(h.membershipWrites).toEqual([])
  })

  it.each(['COD', 'ONLINE'])('order with a membership line-item (%s) is rejected before any write', async (paymentMethod) => {
    const res = await postOrder({ addressId: 'addr_1', paymentMethod, items: [productLine, membershipLine] })
    expect(res.status).toBe(400)
    expect(h.orderCreates).toEqual([])
    expect(h.membershipWrites).toEqual([])
  })

  it('a successful COD order never touches userMembership', async () => {
    const res = await postOrder({ addressId: 'addr_1', paymentMethod: 'COD', items: [productLine] })
    expect(res.status).toBe(201)
    expect(h.membershipWrites).toEqual([])
  })
})

describe('ONLINE payment is not offered', () => {
  it('API rejects ONLINE orders before creating an order', async () => {
    const res = await postOrder({ addressId: 'addr_1', paymentMethod: 'ONLINE', items: [productLine] })
    expect(res.status).toBe(400)
    expect(h.orderCreates).toEqual([])
    expect(h.forwarded).toEqual([])
  })
})

describe('inventory is claimed atomically', () => {
  it('returns 409 and creates no order when the conditional stock update loses the race', async () => {
    h.stockAvailable = false
    const res = await postOrder({ addressId: 'addr_1', paymentMethod: 'COD', items: [productLine] })
    expect(res.status).toBe(409)
    expect(h.orderCreates).toEqual([])
    expect(h.forwarded).toEqual([])
  })

  it('decrements stock inside the transaction before creating a COD order', async () => {
    const res = await postOrder({ addressId: 'addr_1', paymentMethod: 'COD', items: [productLine] })
    expect(res.status).toBe(201)
    expect(h.stockClaims[0]).toMatchObject({
      where: { id: 'prod_1', isActive: true, inStock: true, stockQuantity: { gte: 1 } },
      data: { stockQuantity: { decrement: 1 } },
    })
  })
})
describe('checkout request integrity', () => {
  it('requires an idempotency key before performing writes', async () => {
    const { POST } = await import('@/app/api/orders/route')
    const res = await POST(jsonRequest('/api/orders', 'POST', {
      addressId: 'addr_1', paymentMethod: 'COD', items: [productLine],
    }))
    expect(res.status).toBe(400)
    expect(h.orderCreates).toEqual([])
  })

  it('returns the previous order without claiming stock or creating another order', async () => {
    h.existingOrder = {
      id: 'order_existing',
      orderNumber: 'ORD-EXISTING',
      total: 160,
      items: [],
      user: { name: 'Customer', phone: '+8801711111111' },
    }
    const res = await postOrder({ addressId: 'addr_1', paymentMethod: 'COD', items: [productLine] })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toMatchObject({ success: true, idempotent: true, order: { id: 'order_existing' } })
    expect(h.stockClaims).toEqual([])
    expect(h.orderCreates).toEqual([])
  })

  it('rejects ambiguous lines containing more than one item identifier', async () => {
    const res = await postOrder({
      addressId: 'addr_1',
      paymentMethod: 'COD',
      items: [{ medicineId: 'med_1', productId: 'prod_1', quantity: 1, price: 100 }],
    })
    expect(res.status).toBe(400)
    expect(h.stockClaims).toEqual([])
    expect(h.orderCreates).toEqual([])
  })
})
describe('COD continues to work', () => {
  it('creates a PENDING_COD order with server-side pricing and forwards it for fulfilment', async () => {
    const res = await postOrder({ addressId: 'addr_1', paymentMethod: 'COD', items: [productLine] })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(h.orderCreates).toHaveLength(1)
    expect(h.orderCreates[0]).toMatchObject({
      paymentMethod: 'COD',
      paymentStatus: 'PENDING_COD',
      subtotal: 100,
      deliveryCharge: 60,
      total: 160,
      status: 'PENDING',
    })
    expect(h.forwarded).toEqual(['order_1'])
  })
})
