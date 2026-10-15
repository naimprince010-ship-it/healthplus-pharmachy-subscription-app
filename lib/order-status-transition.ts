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
