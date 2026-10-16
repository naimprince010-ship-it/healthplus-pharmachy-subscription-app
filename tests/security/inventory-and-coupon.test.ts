import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { reserveOrderInventory } from '@/lib/order-inventory'
import { generateOrderNumber } from '@/lib/utils'

describe('atomic inventory reservation', () => {
  it('allows exactly one of ten concurrent claims when stock is one', async () => {
    let stock = 1
    let inStock = true

    const delegate = {
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const mutation = data.stockQuantity as { decrement?: number } | undefined
        if (mutation?.decrement) {
          const required = mutation.decrement
          const canClaim = inStock && stock >= required
          if (!canClaim) return { count: 0 }
          stock -= required
          return { count: 1 }
        }

        if (where.stockQuantity === 0 && stock === 0) {
          inStock = false
          return { count: 1 }
        }
        return { count: 0 }
      },
    }

    const tx = { medicine: delegate, product: delegate }
    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        reserveOrderInventory(tx, [{ productId: 'prod_1', quantity: 1 }]),
      ),
    )

    expect(attempts.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(attempts.filter((result) => result.status === 'rejected')).toHaveLength(9)
    expect(stock).toBe(0)
    expect(inStock).toBe(false)
  })
})

describe('coupon and order-number race guards', () => {
  it('claims a limited coupon with guarded updateMany before recording usage', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'app', 'api', 'orders', 'route.ts'),
      'utf8',
    )
    expect(source).toContain('tx.coupon.updateMany')
    expect(source).toContain('usageCount: { lt: c.usageLimit }')
    expect(source).toContain("throw new Error('COUPON_EXHAUSTED')")
  })

  it('persists a unique checkout request id for retry-safe order creation', () => {
    const schema = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'prisma', 'schema.prisma'),
      'utf8',
    )
    const route = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'app', 'api', 'orders', 'route.ts'),
      'utf8',
    )
    expect(schema).toContain('checkoutRequestId        String?')
    expect(schema).toContain('@@unique([userId, checkoutRequestId])')
    expect(route).toContain("request.headers.get('idempotency-key')")
    expect(route).toContain('checkoutRequestId,')
    expect(route).toContain("err.code === 'P2002'")
  })

  it('generates unique opaque order numbers under a tight loop', () => {
    const numbers = Array.from({ length: 10_000 }, generateOrderNumber)
    expect(new Set(numbers).size).toBe(numbers.length)
    expect(numbers.every((value) => /^ORD-[A-Z0-9]+-[A-F0-9]{8}$/.test(value))).toBe(true)
  })
})
