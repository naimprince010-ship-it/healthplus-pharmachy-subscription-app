/**
 * Azan (cost) → retail list price, and safe flash discount vs minimum gross margin.
 *
 * **Naming (important for merchandising):**
 * - **Markup on cost** = (selling - cost) / cost. Default policy is **60%** → sell at **cost × 1.6**.
 *   That is *not* 60% "margin" in accounting sense.
 * - **Gross margin on retail** = (selling - cost) / selling. For 1.6× that is 37.5% (0.6/1.6).
 *
 * Environment (single source of truth for multiplier):
 * - `AZAN_WHOLESALE_MARKUP` = absolute multiplier, e.g. `1.6` (wins if set)
 * - else `AZAN_WHOLESALE_DEFAULT_MARGIN_PERCENT` = markup on cost, default **60** → multiplier 1.6
 */

/** Default: 60% markup on cost → multiply cost by 1.6 (same as AZAN_WHOLESALE_MARKUP=1.6) */
const DEFAULT_MARKUP_ON_COST_PERCENT = 60

export function getAzanRetailMultiplierFromEnv(): number {
  const raw = process.env.AZAN_WHOLESALE_MARKUP?.trim()
  if (raw) {
    const m = Number.parseFloat(raw)
    if (Number.isFinite(m) && m > 1) return m
  }
  const p = Number.parseFloat(
    process.env.AZAN_WHOLESALE_DEFAULT_MARGIN_PERCENT ?? String(DEFAULT_MARKUP_ON_COST_PERCENT),
  )
  const margin = Number.isFinite(p) ? p : DEFAULT_MARKUP_ON_COST_PERCENT
  return 1 + margin / 100
}

/** (selling - cost) / cost * 100 */
export function markupOnCostPercent(selling: number, cost: number): number {
  if (cost <= 0 || !Number.isFinite(cost) || !Number.isFinite(selling)) return 0
  return ((selling - cost) / cost) * 100
}

/** (selling - cost) / selling * 100 — "margin %" on the price tag */
export function grossMarginOnRetailPercent(selling: number, cost: number): number {
  if (selling <= 0 || !Number.isFinite(selling) || !Number.isFinite(cost)) return 0
  return ((selling - cost) / selling) * 100
}

/**
 * Max % discount off *list* (selling) so that post-flash gross margin is at least `minGrossPercent`.
 * minGrossPercent is on retail, e.g. 20 = keep at least 20% gross on the flash price.
 */
export function maxListDiscountPercentForMinGrossMargin(
  listPrice: number,
  cost: number,
  minGrossPercent: number,
): number {
  if (listPrice <= 0 || cost <= 0 || !Number.isFinite(listPrice) || !Number.isFinite(cost)) return 0
  const minG = Math.max(0, Math.min(99, minGrossPercent)) / 100
  const minAllowedPrice = cost / (1 - minG)
  if (minAllowedPrice >= listPrice) return 0
  return ((listPrice - minAllowedPrice) / listPrice) * 100
}

/**
 * Suggested % off list for flash: min(target%, margin-safe cap).
 * `targetDiscountPercent` = merchandising want (e.g. 12)
 */
export function suggestFlashDiscountPercentOffList(input: {
  listPrice: number
  cost: number
  minGrossPercent: number
  targetDiscountPercent: number
}): { discountPercent: number; minGrossIfApplied: number; cappedBy: 'target' | 'margin' } {
  const { listPrice, cost, minGrossPercent, targetDiscountPercent } = input
  const cap = maxListDiscountPercentForMinGrossMargin(listPrice, cost, minGrossPercent)
  const t = Math.max(0, targetDiscountPercent)
  const discount = Math.min(t, cap)
  const flash = listPrice * (1 - discount / 100)
  const g = grossMarginOnRetailPercent(flash, cost)
  return {
    discountPercent: Math.round(discount * 100) / 100,
    minGrossIfApplied: Math.round(g * 100) / 100,
    cappedBy: discount < t ? 'margin' : 'target',
  }
}

/**
 * If list ≈ cost × multiplier, returns max off-list for min gross, as a function of only multipliers.
 * Example: 1.6 list/cost, min gross 20% → ~21.9% off list.
 */
export function explainMaxFlashOffListForPolicy(input: {
  listOverCost: number
  minGrossPercent: number
}): number {
  const { listOverCost, minGrossPercent } = input
  const c = 1
  const list = c * listOverCost
  return maxListDiscountPercentForMinGrossMargin(list, c, minGrossPercent)
}
