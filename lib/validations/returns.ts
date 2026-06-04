import { z } from 'zod'

export const returnRequestStatusValues = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'RECEIVED',
  'CLOSED',
] as const

export const returnReasonValues = [
  'DAMAGED',
  'WRONG_ITEM',
  'EXPIRED',
  'QUALITY_ISSUE',
  'NOT_AS_DESCRIBED',
  'OTHER',
] as const

export const returnRequestStatusSchema = z.enum(returnRequestStatusValues)
export const returnReasonSchema = z.enum(returnReasonValues)

export const createReturnItemSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  note: z.string().max(500).optional(),
})

export const createReturnRequestSchema = z.object({
  orderId: z.string().min(1),
  reason: returnReasonSchema,
  customerNote: z.string().max(2000).optional(),
  evidenceUrls: z.array(z.string().url()).max(10).optional(),
  items: z.array(createReturnItemSchema).min(1),
})

export const updateReturnStatusSchema = z.object({
  status: returnRequestStatusSchema,
  note: z.string().max(2000).optional(),
})

const transitionMap: Record<string, readonly string[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['RECEIVED', 'REJECTED'],
  REJECTED: ['CLOSED'],
  RECEIVED: ['CLOSED'],
  CLOSED: [],
}

export function isValidReturnTransition(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === toStatus) return true
  return transitionMap[fromStatus]?.includes(toStatus) ?? false
}
