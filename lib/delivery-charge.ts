const INSIDE_DHAKA_CHARGE = 70
const OUTSIDE_DHAKA_CHARGE = 150
const DHAKA_SUB_AREA_CHARGE = 150

const DHAKA_SUB_AREA_KEYWORDS = [
  'dhaka sub',
  'sub area',
  'sub-area',
  'savar',
  'keraniganj',
  'dhamrai',
]

export function resolveDeliveryChargeByZoneName(zoneName: string): number {
  const normalized = zoneName.trim().toLowerCase()

  if (!normalized) return OUTSIDE_DHAKA_CHARGE

  const isDhakaSubArea = DHAKA_SUB_AREA_KEYWORDS.some((keyword) => normalized.includes(keyword))
  if (isDhakaSubArea) return DHAKA_SUB_AREA_CHARGE

  if (normalized.includes('inside dhaka')) return INSIDE_DHAKA_CHARGE
  if (normalized.includes('outside dhaka') || normalized.includes('out of dhaka')) return OUTSIDE_DHAKA_CHARGE

  // Fallback: Dhaka defaults to inside-Dhaka pricing, non-Dhaka defaults to outside.
  if (normalized.includes('dhaka')) return INSIDE_DHAKA_CHARGE
  return OUTSIDE_DHAKA_CHARGE
}
