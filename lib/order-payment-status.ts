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
