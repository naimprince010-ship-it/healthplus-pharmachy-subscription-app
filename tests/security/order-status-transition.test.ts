import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { restoreOrderInventory } from '@/lib/order-inventory'
import { canTransitionOrderStatus } from '@/lib/order-status-transition'

describe('order status state machine', () => {
  it('allows forward fulfillment and pre-shipment cancellation only', () => {
    expect(canTransitionOrderStatus('PENDING', 'CONFIRMED')).toBe(true)
    expect(canTransitionOrderStatus('PENDING', 'CANCELLED')).toBe(true)
    expect(canTransitionOrderStatus('CONFIRMED', 'PROCESSING')).toBe(true)
    expect(canTransitionOrderStatus('PROCESSING', 'SHIPPED')).toBe(true)
    expect(canTransitionOrderStatus('SHIPPED', 'DELIVERED')).toBe(true)

    expect(canTransitionOrderStatus('SHIPPED', 'CANCELLED')).toBe(false)
    expect(canTransitionOrderStatus('DELIVERED', 'PROCESSING')).toBe(false)
    expect(canTransitionOrderStatus('CANCELLED', 'PENDING')).toBe(false)
  })

  it('treats a repeated status as idempotent', () => {
    expect(canTransitionOrderStatus('CANCELLED', 'CANCELLED')).toBe(true)
    expect(canTransitionOrderStatus('DELIVERED', 'DELIVERED')).toBe(true)
  })
})

describe('cancellation stock restoration', () => {
  it('increments medicine and product stock and marks them in stock', async () => {
    const medicineUpdate = vi.fn(async () => ({ count: 1 }))
    const productUpdate = vi.fn(async () => ({ count: 1 }))

    await restoreOrderInventory(
      {
        medicine: { updateMany: medicineUpdate },
        product: { updateMany: productUpdate },
      },
      [
        { medicineId: 'med_1', quantity: 2 },
        { productId: 'prod_1', quantity: 3 },
      ],
    )

    expect(medicineUpdate).toHaveBeenCalledWith({
      where: { id: 'med_1' },
      data: { stockQuantity: { increment: 2 }, inStock: true },
    })
    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: 'prod_1' },
      data: { stockQuantity: { increment: 3 }, inStock: true },
    })
  })

  it('status route uses a compare-and-set transition before restoring inventory', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'app', 'api', 'admin', 'orders', '[id]', 'status', 'route.ts'),
      'utf8',
    )
    const claim = source.indexOf('tx.order.updateMany')
    const restore = source.indexOf('await restoreOrderInventory')
    expect(claim).toBeGreaterThan(0)
    expect(restore).toBeGreaterThan(claim)
    expect(source).toContain('where: { id, status: current.status }')
    expect(source).toContain("if (transition.count !== 1) throw new Error('ORDER_CHANGED')")
  })
})
