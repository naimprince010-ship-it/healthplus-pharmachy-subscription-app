/** Persisted on Order.paymentStatus — keep existing "PENDING" rows as legacy. */

export const PaymentStatus = {
  PAID: 'PAID',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PENDING_COD: 'PENDING_COD',
  PENDING: 'PENDING',
} as const

export type PaymentStatusValue = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export function initialPaymentStatus(
  paymentMethod: 'COD' | 'ONLINE'
): PaymentStatusValue {
  if (paymentMethod === 'ONLINE') return PaymentStatus.AWAITING_PAYMENT
  return PaymentStatus.PENDING_COD
}

export function orderReadyForFulfillment(payload: {
  paymentMethod: 'COD' | 'ONLINE'
  paymentStatus: string
}): boolean {
  if (payload.paymentMethod === 'COD') return true
  return payload.paymentStatus === PaymentStatus.PAID
}

export function canTransitionPaymentStatus(
  paymentMethod: 'COD' | 'ONLINE',
  current: string,
  next: PaymentStatusValue
): boolean {
  if (current === next) return true

  if (paymentMethod === 'COD') {
    if (next === PaymentStatus.AWAITING_PAYMENT) return false
    if (current === PaymentStatus.PAID) return false
    return (
      (current === PaymentStatus.PENDING || current === PaymentStatus.PENDING_COD) &&
      (next === PaymentStatus.PENDING_COD || next === PaymentStatus.PAID)
    )
  }

  if (next === PaymentStatus.PENDING_COD) return false
  if (current === PaymentStatus.PAID) return false
  return (
    (current === PaymentStatus.PENDING || current === PaymentStatus.AWAITING_PAYMENT) &&
    (next === PaymentStatus.AWAITING_PAYMENT || next === PaymentStatus.PAID)
  )
}
