import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveDeliveryChargeForZone } from '@/lib/delivery-charge'

describe('delivery charge authority', () => {
  it('uses the admin-configured deliveryFee before legacy or name defaults', () => {
    expect(resolveDeliveryChargeForZone({
      name: 'Inside Dhaka',
      deliveryFee: 95,
      deliveryCharge: 70,
    })).toBe(95)
    expect(resolveDeliveryChargeForZone({
      name: 'Outside Dhaka',
      deliveryFee: null,
      deliveryCharge: 140,
    })).toBe(140)
  })

  it('revalidates active zone and fee inside the order transaction', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'app', 'api', 'orders', 'route.ts'),
      'utf8',
    )
    const transaction = source.indexOf('prisma.$transaction')
    const zoneRead = source.indexOf('tx.zone.findUnique')
    const inventory = source.indexOf('await reserveOrderInventory', transaction)
    expect(zoneRead).toBeGreaterThan(transaction)
    expect(inventory).toBeGreaterThan(zoneRead)
    expect(source).toContain("throw new Error('DELIVERY_ZONE_UNAVAILABLE')")
    expect(source).toContain("throw new Error('DELIVERY_ZONE_CHANGED')")
  })

  it('requires active zones for saved addresses and new orders', () => {
    const addresses = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'app', 'api', 'addresses', 'route.ts'),
      'utf8',
    )
    const orders = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'app', 'api', 'orders', 'route.ts'),
      'utf8',
    )
    expect(addresses).toContain('if (!zone?.isActive)')
    expect(orders).toContain('address.hiddenFromCheckout || !address.zone.isActive')
    expect(orders).toContain('if (!zone?.isActive)')
  })
})
