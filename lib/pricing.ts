/**
 * Pricing helper functions for medicine calculations
 */

export interface ProductWithPricing {
  sellingPrice: number
  mrp?: number | null
  discountPercentage?: number | null
  flashSalePrice?: number | null
  flashSaleStart?: Date | string | null
  flashSaleEnd?: Date | string | null
  isFlashSale?: boolean | null
  campaignPrice?: number | null
  campaignStart?: Date | string | null
  campaignEnd?: Date | string | null
}

export interface EffectivePrices {
  price: number
  mrp: number
  discountAmount: number
  discountPercent: number
  isFlashSale: boolean
  isCampaign: boolean
}

export function getEffectivePrices(product: ProductWithPricing): EffectivePrices {
  const baseMrp = product.mrp ?? product.sellingPrice
  const now = new Date()

  const flashStart = product.flashSaleStart ? new Date(product.flashSaleStart) : null
  const flashEnd = product.flashSaleEnd ? new Date(product.flashSaleEnd) : null

  const flashActive =
    product.isFlashSale === true &&
    product.flashSalePrice != null &&
    product.flashSalePrice > 0 &&
    (!flashStart || flashStart <= now) &&
    (!flashEnd || flashEnd >= now) &&
    product.flashSalePrice < baseMrp

  const campaignStart = product.campaignStart ? new Date(product.campaignStart) : null
  const campaignEnd = product.campaignEnd ? new Date(product.campaignEnd) : null

  const campaignActive =
    product.campaignPrice != null &&
    product.campaignPrice > 0 &&
    (!campaignStart || campaignStart <= now) &&
    (!campaignEnd || campaignEnd >= now) &&
    product.campaignPrice < baseMrp

  let price: number
  let isFlashSale = false
  let isCampaign = false

  if (flashActive && product.flashSalePrice != null) {
    price = product.flashSalePrice
    isFlashSale = true
  } else if (campaignActive && product.campaignPrice != null) {
    price = product.campaignPrice
    isCampaign = true
  } else if (product.discountPercentage && product.discountPercentage > 0) {
    price = Math.round(product.sellingPrice * (1 - product.discountPercentage / 100))
  } else {
    price = product.sellingPrice
  }

  const discountAmount = baseMrp - price
  const discountPercent = baseMrp > 0 ? Math.round((discountAmount / baseMrp) * 100) : 0

  return {
    price,
    mrp: baseMrp,
    discountAmount,
    discountPercent,
    isFlashSale,
    isCampaign,
  }
}

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
