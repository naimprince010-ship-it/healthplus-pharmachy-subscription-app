import type { SubscriptionPlan } from '@prisma/client'

/** Lines from admin `itemsJson.medicines` (or aliases) for storefront detail. */
export function getMedicineLinesFromItemsJson(plan: SubscriptionPlan): string[] {
  if (!plan.itemsJson || typeof plan.itemsJson !== 'object' || Array.isArray(plan.itemsJson)) return []
  const j = plan.itemsJson as Record<string, unknown>
  for (const key of ['medicines', 'detailLines', 'lines', 'brands']) {
    const v = j[key]
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((s) => s.trim())
    }
  }
  return []
}

export function getSubscriptionPlanBulletLines(plan: SubscriptionPlan): string[] {
  return plan.itemsSummary
    ?.split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean) ?? []
}
