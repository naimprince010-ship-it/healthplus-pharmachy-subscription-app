import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  canTransitionPaymentStatus,
  PaymentStatus,
} from '@/lib/order-payment-status'

describe('payment status state machine', () => {
  it('allows COD payment collection without online-only states', () => {
    expect(canTransitionPaymentStatus('COD', PaymentStatus.PENDING_COD, PaymentStatus.PAID)).toBe(true)
    expect(canTransitionPaymentStatus('COD', PaymentStatus.PENDING_COD, PaymentStatus.AWAITING_PAYMENT)).toBe(false)
    expect(canTransitionPaymentStatus('COD', PaymentStatus.PAID, PaymentStatus.PENDING_COD)).toBe(false)
  })

  it('allows online settlement without COD-only states or paid rollback', () => {
    expect(canTransitionPaymentStatus('ONLINE', PaymentStatus.AWAITING_PAYMENT, PaymentStatus.PAID)).toBe(true)
    expect(canTransitionPaymentStatus('ONLINE', PaymentStatus.AWAITING_PAYMENT, PaymentStatus.PENDING_COD)).toBe(false)
    expect(canTransitionPaymentStatus('ONLINE', PaymentStatus.PAID, PaymentStatus.AWAITING_PAYMENT)).toBe(false)
  })

  it('supports legacy PENDING rows and idempotent repeats', () => {
    expect(canTransitionPaymentStatus('COD', PaymentStatus.PENDING, PaymentStatus.PENDING_COD)).toBe(true)
    expect(canTransitionPaymentStatus('ONLINE', PaymentStatus.PENDING, PaymentStatus.AWAITING_PAYMENT)).toBe(true)
    expect(canTransitionPaymentStatus('ONLINE', PaymentStatus.PAID, PaymentStatus.PAID)).toBe(true)
  })
})

describe('payment route concurrency guard', () => {
  it('uses compare-and-set before triggering paid side effects', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'app', 'api', 'admin', 'orders', '[id]', 'payment', 'route.ts'),
      'utf8'
    )
    expect(source).toContain('prisma.$transaction')
    expect(source).toContain('tx.order.updateMany')
    expect(source).toContain('where: { id, paymentStatus: before.paymentStatus }')
    expect(source).toContain("if (transition.count !== 1) throw new Error('ORDER_PAYMENT_CHANGED')")
    expect(source).toContain('transitioned &&')
  })
})
