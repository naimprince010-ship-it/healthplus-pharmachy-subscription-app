import type { OrderStatus } from '@prisma/client'

const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return current === next || ALLOWED_ORDER_TRANSITIONS[current].includes(next)
}

const FULFILLMENT_RANK: Partial<Record<OrderStatus, number>> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
}

/** Supplier sync may skip forward steps, but must never regress or cancel after shipment. */
export function canApplySupplierOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  if (current === next) return true
  if (next === 'CANCELLED') return canTransitionOrderStatus(current, next)
  if (current === 'CANCELLED') return false

  const currentRank = FULFILLMENT_RANK[current]
  const nextRank = FULFILLMENT_RANK[next]
  return currentRank !== undefined && nextRank !== undefined && nextRank > currentRank
}
