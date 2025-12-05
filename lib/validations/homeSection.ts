import { z } from 'zod'

// Display location options for sections
export const DISPLAY_LOCATIONS = ['home', 'dashboard', 'cart'] as const
export type DisplayLocation = typeof DISPLAY_LOCATIONS[number]

// Base schema for form validation (used by HomeSectionForm for both create and edit)
export const baseHomeSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  filterType: z.enum(['category', 'brand', 'manual']),
  categoryId: z.string().optional().nullable(),
  brandName: z.string().optional().nullable(),
  productIds: z.array(z.string()).optional().nullable(),
  maxProducts: z.number().int().min(1).max(50).default(10),
  bgColor: z.string().optional().nullable(),
  badgeText: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  displayLocations: z.array(z.enum(['home', 'dashboard', 'cart'])).default(['home']),
})

// For API route validation (create doesn't need id, update does)
export const createHomeSectionSchema = baseHomeSectionSchema

export const updateHomeSectionSchema = baseHomeSectionSchema.extend({
  id: z.string(),
})

export type BaseHomeSectionInput = z.infer<typeof baseHomeSectionSchema>
export type CreateHomeSectionInput = z.infer<typeof createHomeSectionSchema>
export type UpdateHomeSectionInput = z.infer<typeof updateHomeSectionSchema>
