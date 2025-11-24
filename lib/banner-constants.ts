/**
 * Banner system constants
 */

export const BANNER_LOCATIONS = {
  HOME_HERO: 'HOME_HERO',
  HOME_MID: 'HOME_MID',
  CATEGORY_TOP: 'CATEGORY_TOP',
} as const

export type BannerLocation = keyof typeof BANNER_LOCATIONS

export const BANNER_LOCATION_LABELS: Record<BannerLocation, string> = {
  HOME_HERO: 'Home Hero',
  HOME_MID: 'Home Mid Section',
  CATEGORY_TOP: 'Category Top',
}

export const DEVICE_OPTIONS = {
  ALL: 'all',
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
} as const

export type DeviceType = typeof DEVICE_OPTIONS[keyof typeof DEVICE_OPTIONS]

export const DEVICE_LABELS: Record<DeviceType, string> = {
  all: 'All Devices',
  desktop: 'Desktop Only',
  mobile: 'Mobile Only',
}

export const RECOMMENDED_IMAGE_SIZES = {
  desktop: '1920x600px',
  mobile: '768x400px',
}
