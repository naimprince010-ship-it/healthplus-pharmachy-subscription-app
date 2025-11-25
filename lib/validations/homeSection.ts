import { z } from 'zod'

export const createHomeSectionSchema = z.object({
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
})

export const updateHomeSectionSchema = createHomeSectionSchema.extend({
  id: z.string(),
})

export type CreateHomeSectionInput = z.infer<typeof createHomeSectionSchema>
export type UpdateHomeSectionInput = z.infer<typeof updateHomeSectionSchema>
