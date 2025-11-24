/**
 * Banner helper functions for fetching and filtering active banners
 */

import { prisma } from '@/lib/prisma'
import { BannerLocation, DeviceType } from '@/lib/banner-constants'

/**
 * Fetch active banners for a specific location and device type
 * Applies scheduling and device visibility filters
 * 
 * @param locationCode - Banner location (HOME_HERO, HOME_MID, etc.)
 * @param deviceType - Device type (desktop, mobile, or all)
 * @returns Array of active banners sorted by order and creation date
 */
export async function getActiveBanners(
  locationCode: BannerLocation,
  deviceType: 'desktop' | 'mobile' = 'desktop'
) {
  const now = new Date()

  try {
    const banners = await prisma.banner.findMany({
      where: {
        location: locationCode,
        isActive: true,
        OR: [
          { startAt: null },
          { startAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: now } },
            ],
          },
          {
            OR: [
              { visibilityDevice: 'all' },
              { visibilityDevice: deviceType },
            ],
          },
        ],
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return banners
  } catch (error) {
    console.error('Error fetching active banners:', error)
    return []
  }
}

/**
 * Get the appropriate image URL for a banner based on device type
 * Falls back to legacy imageUrl if device-specific image is not available
 * 
 * @param banner - Banner object
 * @param deviceType - Device type (desktop or mobile)
 * @returns Image URL string
 */
export function getBannerImageUrl(
  banner: {
    imageUrl: string
    imageDesktopUrl?: string | null
    imageMobileUrl?: string | null
  },
  deviceType: 'desktop' | 'mobile' = 'desktop'
): string {
  if (deviceType === 'mobile' && banner.imageMobileUrl) {
    return banner.imageMobileUrl
  }
  
  if (deviceType === 'desktop' && banner.imageDesktopUrl) {
    return banner.imageDesktopUrl
  }

  return banner.imageUrl
}

/**
 * Get the CTA URL for a banner
 * Prefers ctaUrl over legacy link field
 * 
 * @param banner - Banner object
 * @returns CTA URL string or null
 */
export function getBannerCtaUrl(
  banner: {
    ctaUrl?: string | null
    link?: string | null
  }
): string | null {
  return banner.ctaUrl || banner.link || null
}
