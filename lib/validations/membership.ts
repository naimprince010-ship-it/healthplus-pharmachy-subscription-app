import { z } from 'zod'

export const membershipPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  durationDays: z.number().int().positive('Duration must be greater than 0'),
  discountPercent: z.number().min(0, 'Discount must be at least 0').max(100, 'Discount cannot exceed 100'),
  isActive: z.boolean().default(true),
})

export const updateMembershipPlanSchema = membershipPlanSchema.partial()

export type MembershipPlanInput = z.infer<typeof membershipPlanSchema>
export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>
