/**
 * Pricing helper functions for medicine calculations
 */

/**
 * Parse tablets per strip from pack size string
 * Examples: "1 strip x 10 tablets" -> 10, "10 tablets" -> 10, "1x10" -> 10
 */
export function parseTabletsFromPackSize(packSize?: string): number | undefined {
  if (!packSize) return undefined

  const patterns = [
    /x\s*(\d+)/i,           // "x 10" or "x10"
    /(\d+)\s*tablets?/i,    // "10 tablets" or "10 tablet"
    /(\d+)\s*capsules?/i,   // "10 capsules" or "10 capsule"
    /(\d+)\s*pcs/i,         // "10 pcs"
  ]

  for (const pattern of patterns) {
    const match = packSize.match(pattern)
    if (match && match[1]) {
      const num = parseInt(match[1], 10)
      if (num > 0) return num
    }
  }

  return undefined
}

/**
 * Compute strip price from unit price and tablets per strip
 */
export function computeStripPrice(
  unitPrice?: number,
  tabletsPerStrip?: number
): number | undefined {
  if (!unitPrice || !tabletsPerStrip || unitPrice <= 0 || tabletsPerStrip <= 0) {
    return undefined
  }
  return unitPrice * tabletsPerStrip
}

/**
 * Get the final selling price, defaulting to strip price if not provided
 */
export function defaultSellingPrice(
  sellingPrice?: number,
  stripPrice?: number
): number | undefined {
  if (sellingPrice !== undefined && sellingPrice > 0) {
    return sellingPrice
  }
  if (stripPrice !== undefined && stripPrice > 0) {
    return stripPrice
  }
  return undefined
}

/**
 * Generate SEO title from medicine details
 */
export function generateSeoTitle(params: {
  name: string
  strength?: string
  dosageForm?: string
  packSize?: string
}): string {
  const parts = [params.name]
  
  if (params.strength) {
    parts.push(params.strength)
  }
  
  if (params.dosageForm) {
    parts.push(params.dosageForm)
  }
  
  if (params.packSize) {
    parts.push(`(${params.packSize})`)
  }
  
  return parts.join(' ')
}
