/**
 * Zod validation schemas for Medicine CRUD operations
 */

import { z } from 'zod'

/**
 * Helper to convert empty/NaN values to undefined for optional numeric fields
 */
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || Number.isNaN(val)) {
      return undefined
    }
    return Number(val)
  }, schema.optional())

/**
 * Base medicine schema for creation
 */
export const createMedicineSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  genericName: z.string().max(200).optional(),
  brandName: z.string().max(200).optional(),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(200),
  dosageForm: z.string().max(100).optional(),
  packSize: z.string().max(100).optional(),
  strength: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  
  categoryId: z.string().min(1, 'Category is required'),
  
  mrp: optionalNumber(z.number().positive('MRP must be positive')),
  sellingPrice: optionalNumber(z.number().positive('Selling price must be positive')),
  unitPrice: optionalNumber(z.number().positive('Unit price must be positive')),
  stripPrice: optionalNumber(z.number().positive('Strip price must be positive')),
  tabletsPerStrip: optionalNumber(z.number().int().positive('Tablets per strip must be positive')),
  
  stockQuantity: optionalNumber(z.number().int().nonnegative('Stock cannot be negative')),
  minStockAlert: optionalNumber(z.number().int().positive()),
  
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().max(500).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  
  imageUrl: z.string().url().optional().or(z.literal('')),
  imagePath: z.string().optional(),
  
  uses: z.string().max(2000).optional(),
  sideEffects: z.string().max(2000).optional(),
  contraindications: z.string().max(2000).optional(),
  storageInstructions: z.string().max(500).optional(),
  expiryDate: z.string().optional(),
  
  requiresPrescription: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => {
    if (data.mrp && data.sellingPrice && data.sellingPrice > data.mrp) {
      return false
    }
    return true
  },
  {
    message: 'Selling price cannot be greater than MRP',
    path: ['sellingPrice'],
  }
)

/**
 * Schema for updating a medicine (all fields optional except validation rules)
 */
export const updateMedicineSchema = createMedicineSchema.partial().extend({
  id: z.string().min(1, 'Medicine ID is required'),
}).refine(
  (data) => {
    if (data.mrp !== undefined && data.sellingPrice !== undefined && data.sellingPrice > data.mrp) {
      return false
    }
    return true
  },
  {
    message: 'Selling price cannot be greater than MRP',
    path: ['sellingPrice'],
  }
)

/**
 * Schema for medicine list query parameters
 */
export const medicineListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
  isFeatured: z.enum(['true', 'false', 'all']).optional().default('all'),
  requiresPrescription: z.enum(['true', 'false', 'all']).optional().default('all'),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'sellingPrice', 'stockQuantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Schema for soft delete operation
 */
export const deleteMedicineSchema = z.object({
  id: z.string().min(1, 'Medicine ID is required'),
})

/**
 * Type exports for use in API routes and components
 */
export type CreateMedicineInput = z.input<typeof createMedicineSchema>
export type CreateMedicineOutput = z.output<typeof createMedicineSchema>
export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>
export type MedicineListQuery = z.infer<typeof medicineListQuerySchema>
export type DeleteMedicineInput = z.infer<typeof deleteMedicineSchema>
