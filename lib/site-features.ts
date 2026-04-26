/**
 * Temporary retail scope flags (e.g. Azan-only period). Use NEXT_PUBLIC_* so client components can read them.
 * Default: enabled (true) when env is unset — preserves current behaviour.
 */

export const GROCERY_CATEGORY_SLUG = 'grocery'

function parseEnabled(v: string | undefined, defaultEnabled: boolean): boolean {
  if (v == null || v === '') return defaultEnabled
  const s = v.trim().toLowerCase()
  if (['false', '0', 'no', 'off'].includes(s)) return false
  if (['true', '1', 'yes', 'on'].includes(s)) return true
  return defaultEnabled
}

/** Legacy /medicines + Medicine rows in API + Product.type === MEDICINE */
export function isMedicineShopEnabled(): boolean {
  return parseEnabled(
    process.env.NEXT_PUBLIC_SITE_MEDICINE_SHOP_ENABLED ?? process.env.SITE_MEDICINE_SHOP_ENABLED,
    true,
  )
}

/** Category slug `grocery` — products in that category */
export function isGroceryShopEnabled(): boolean {
  return parseEnabled(
    process.env.NEXT_PUBLIC_SITE_GROCERY_ENABLED ?? process.env.SITE_GROCERY_ENABLED,
    true,
  )
}

/** Prescription upload CTA — defaults to same as medicine shop unless overridden */
export function isPrescriptionFlowEnabled(): boolean {
  const explicit = process.env.NEXT_PUBLIC_SITE_PRESCRIPTION_ENABLED ?? process.env.SITE_PRESCRIPTION_ENABLED
  if (explicit != null && explicit !== '') {
    return parseEnabled(explicit, true)
  }
  return isMedicineShopEnabled()
}
