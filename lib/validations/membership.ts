import { z } from 'zod'

export const membershipPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  originalPrice: z.number().positive('Original price must be greater than 0').optional().nullable(),
  durationDays: z.number().int().positive('Duration must be greater than 0'),
  discountPercent: z.number().min(0, 'Discount must be at least 0').max(100, 'Discount cannot exceed 100'),
  badge: z.string().max(50).optional().nullable(),
  benefitsJson: z.array(z.string()).optional().nullable(),
  ctaText: z.string().max(100).optional().nullable(),
  isHighlighted: z.boolean().default(false),
  sortOrder: z.number().int().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const updateMembershipPlanSchema = membershipPlanSchema.partial()

export type MembershipPlanInput = z.infer<typeof membershipPlanSchema>
export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>
