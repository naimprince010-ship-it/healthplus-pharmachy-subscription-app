import { prisma } from '@/lib/prisma'
import { DiscountRuleType, DiscountType } from '@prisma/client'

interface EngineResult {
  success: boolean
  rulesProcessed: number
  productsUpdated: number
  productsCleared: number
  errors: string[]
  logs: Array<{
    ruleId: string
    ruleName: string
    productsAffected: number
  }>
}

export async function runDiscountEngine(): Promise<EngineResult> {
  const result: EngineResult = {
    success: true,
    rulesProcessed: 0,
    productsUpdated: 0,
    productsCleared: 0,
    errors: [],
    logs: [],
  }

  const now = new Date()

  try {
    const clearedProducts = await prisma.product.updateMany({
      where: {
        campaignRuleId: { not: null },
        OR: [
          { campaignEnd: { lt: now } },
          { campaignStart: { gt: now } },
        ],
      },
      data: {
        campaignPrice: null,
        campaignStart: null,
        campaignEnd: null,
        campaignRuleId: null,
      },
    })
    result.productsCleared = clearedProducts.count

    const activeRules = await prisma.discountRule.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        ruleType: { in: ['CATEGORY', 'BRAND'] },
      },
      orderBy: { priority: 'desc' },
    })

    result.rulesProcessed = activeRules.length

    for (const rule of activeRules) {
      try {
        let productsAffected = 0

        if (rule.ruleType === DiscountRuleType.CATEGORY && rule.targetValue) {
          const products = await prisma.product.findMany({
            where: {
              categoryId: rule.targetValue,
              isActive: true,
              OR: [
                { campaignRuleId: null },
                { campaignRuleId: { not: null } },
              ],
            },
            select: { id: true, sellingPrice: true, campaignRuleId: true },
          })

          const existingRulePriorities = await getExistingRulePriorities(
            products.filter(p => p.campaignRuleId).map(p => p.campaignRuleId as string)
          )

          for (const product of products) {
            if (product.campaignRuleId) {
              const existingPriority = existingRulePriorities.get(product.campaignRuleId) ?? 0
              if (existingPriority >= rule.priority) {
                continue
              }
            }

            const newPrice = calculateDiscountedPrice(
              product.sellingPrice,
              rule.discountType,
              rule.discountAmount
            )

            if (newPrice < product.sellingPrice) {
              await prisma.product.update({
                where: { id: product.id },
                data: {
                  campaignPrice: newPrice,
                  campaignStart: rule.startDate,
                  campaignEnd: rule.endDate,
                  campaignRuleId: rule.id,
                },
              })

              await prisma.discountLog.create({
                data: {
                  ruleId: rule.id,
                  productId: product.id,
                  oldPrice: product.sellingPrice,
                  newPrice,
                  discountAmount: product.sellingPrice - newPrice,
                },
              })

              productsAffected++
              result.productsUpdated++
            }
          }
        } else if (rule.ruleType === DiscountRuleType.BRAND && rule.targetValue) {
          const products = await prisma.product.findMany({
            where: {
              manufacturerId: rule.targetValue,
              isActive: true,
              OR: [
                { campaignRuleId: null },
                { campaignRuleId: { not: null } },
              ],
            },
            select: { id: true, sellingPrice: true, campaignRuleId: true },
          })

          const existingRulePriorities = await getExistingRulePriorities(
            products.filter(p => p.campaignRuleId).map(p => p.campaignRuleId as string)
          )

          for (const product of products) {
            if (product.campaignRuleId) {
              const existingPriority = existingRulePriorities.get(product.campaignRuleId) ?? 0
              if (existingPriority >= rule.priority) {
                continue
              }
            }

            const newPrice = calculateDiscountedPrice(
              product.sellingPrice,
              rule.discountType,
              rule.discountAmount
            )

            if (newPrice < product.sellingPrice) {
              await prisma.product.update({
                where: { id: product.id },
                data: {
                  campaignPrice: newPrice,
                  campaignStart: rule.startDate,
                  campaignEnd: rule.endDate,
                  campaignRuleId: rule.id,
                },
              })

              await prisma.discountLog.create({
                data: {
                  ruleId: rule.id,
                  productId: product.id,
                  oldPrice: product.sellingPrice,
                  newPrice,
                  discountAmount: product.sellingPrice - newPrice,
                },
              })

              productsAffected++
              result.productsUpdated++
            }
          }
        }

        result.logs.push({
          ruleId: rule.id,
          ruleName: rule.name,
          productsAffected,
        })
      } catch (ruleError) {
        const errorMessage = ruleError instanceof Error ? ruleError.message : 'Unknown error'
        result.errors.push(`Rule ${rule.name} (${rule.id}): ${errorMessage}`)
      }
    }
  } catch (error) {
    result.success = false
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(`Engine error: ${errorMessage}`)
  }

  return result
}

async function getExistingRulePriorities(ruleIds: string[]): Promise<Map<string, number>> {
  if (ruleIds.length === 0) return new Map()

  const rules = await prisma.discountRule.findMany({
    where: { id: { in: ruleIds } },
    select: { id: true, priority: true },
  })

  return new Map(rules.map(r => [r.id, r.priority]))
}

function calculateDiscountedPrice(
  originalPrice: number,
  discountType: DiscountType,
  discountAmount: number
): number {
  if (discountType === DiscountType.PERCENTAGE) {
    const discount = (originalPrice * discountAmount) / 100
    return Math.round((originalPrice - discount) * 100) / 100
  } else {
    return Math.max(0, Math.round((originalPrice - discountAmount) * 100) / 100)
  }
}

export async function clearExpiredCampaigns(): Promise<number> {
  const now = new Date()

  const result = await prisma.product.updateMany({
    where: {
      campaignRuleId: { not: null },
      campaignEnd: { lt: now },
    },
    data: {
      campaignPrice: null,
      campaignStart: null,
      campaignEnd: null,
      campaignRuleId: null,
    },
  })

  return result.count
}
