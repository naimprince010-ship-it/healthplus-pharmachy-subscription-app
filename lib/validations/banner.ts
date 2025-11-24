/**
 * Zod validation schemas for Banner CRUD operations
 */

import { z } from 'zod'
import { BANNER_LOCATIONS, DEVICE_OPTIONS } from '@/lib/banner-constants'

/**
 * Helper to preprocess date strings to Date objects or undefined
 */
const optionalDate = z.preprocess((val) => {
  if (!val || val === '' || val === null) {
    return undefined
  }
  if (typeof val === 'string') {
    const date = new Date(val)
    return isNaN(date.getTime()) ? undefined : date
  }
  return val
}, z.date().optional())

/**
 * Base banner schema for creation
 */
export const createBannerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  location: z.enum([
    BANNER_LOCATIONS.HOME_HERO,
    BANNER_LOCATIONS.HOME_MID,
    BANNER_LOCATIONS.CATEGORY_TOP,
  ] as [string, ...string[]]),
  order: z.coerce.number().int().nonnegative('Order must be non-negative').default(0),
  isActive: z.boolean().default(true),

  imageUrl: z.string().url('Invalid image URL').min(1, 'Image URL is required'), // Legacy field
  imageDesktopUrl: z.string().url('Invalid desktop image URL').optional().or(z.literal('')),
  imageMobileUrl: z.string().url('Invalid mobile image URL').optional().or(z.literal('')),

  link: z.string().url('Invalid link URL').optional().or(z.literal('')), // Legacy field
  ctaLabel: z.string().max(50).optional(),
  ctaUrl: z.string().url('Invalid CTA URL').optional().or(z.literal('')),

  bgColor: z.string().max(50).optional(),
  textColor: z.string().max(50).optional(),

  startAt: optionalDate,
  endAt: optionalDate,
  visibilityDevice: z.enum([
    DEVICE_OPTIONS.ALL,
    DEVICE_OPTIONS.DESKTOP,
    DEVICE_OPTIONS.MOBILE,
  ] as [string, ...string[]]).default(DEVICE_OPTIONS.ALL),
}).refine(
  (data) => {
    if (data.startAt && data.endAt) {
      return data.endAt > data.startAt
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['endAt'],
  }
)

/**
 * Schema for updating a banner (all fields optional except validation rules)
 */
export const updateBannerSchema = createBannerSchema.partial().extend({
  id: z.string().min(1, 'Banner ID is required'),
}).refine(
  (data) => {
    if (data.startAt && data.endAt) {
      return data.endAt > data.startAt
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['endAt'],
  }
)

/**
 * Schema for banner list query parameters
 */
export const bannerListQuerySchema = z.object({
  location: z.enum([
    BANNER_LOCATIONS.HOME_HERO,
    BANNER_LOCATIONS.HOME_MID,
    BANNER_LOCATIONS.CATEGORY_TOP,
    'all',
  ] as const).optional().default('all'),
  isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
})

/**
 * Type exports for use in API routes and components
 */
export type CreateBannerInput = z.infer<typeof createBannerSchema>
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>
export type BannerListQuery = z.infer<typeof bannerListQuerySchema>
