import { z } from 'zod'

export const discountRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  ruleType: z.enum(['CATEGORY', 'BRAND', 'CART_AMOUNT', 'USER_GROUP']),
  targetValue: z.string().optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountAmount: z.number().positive('Discount amount must be positive'),
  minCartAmount: z.number().optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  description: z.string().optional().nullable(),
})

export const updateDiscountRuleSchema = discountRuleSchema.partial()

export const couponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountAmount: z.number().positive('Discount amount must be positive'),
  minCartAmount: z.number().optional().nullable(),
  maxDiscount: z.number().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  perUserLimit: z.number().int().optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean().default(true),
  description: z.string().optional().nullable(),
})

export const updateCouponSchema = couponSchema.partial().omit({ code: true })

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  cartTotal: z.number().positive('Cart total must be positive'),
  userId: z.string().optional(),
})

export type DiscountRuleInput = z.infer<typeof discountRuleSchema>
export type UpdateDiscountRuleInput = z.infer<typeof updateDiscountRuleSchema>
export type CouponInput = z.infer<typeof couponSchema>
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>
