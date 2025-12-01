import { z } from 'zod'

export const manufacturerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug must be less than 200 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  description: z.string().optional().nullable(),
  aliasList: z.array(z.string()).optional().nullable(),
})

export const createManufacturerSchema = manufacturerSchema

export const updateManufacturerSchema = manufacturerSchema.partial().extend({
  id: z.string(),
})

export type ManufacturerInput = z.infer<typeof manufacturerSchema>
export type CreateManufacturerInput = z.infer<typeof createManufacturerSchema>
export type UpdateManufacturerInput = z.infer<typeof updateManufacturerSchema>
