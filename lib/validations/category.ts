import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  parentCategoryId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isMedicineCategory: z.boolean().default(false),
  discountPercentage: z.number().min(0).max(100).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  showInSidebar: z.boolean().default(false),
  sidebarOrder: z.coerce.number().int().min(0).default(0),
  sidebarIconUrl: z.string().trim().optional().nullable(),
  sidebarLinkUrl: z.string().trim().optional().nullable(),
})

export const createCategorySchema = categorySchema

export const updateCategorySchema = categorySchema.partial().extend({
  id: z.string(),
})

export type CategoryInput = z.infer<typeof categorySchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
