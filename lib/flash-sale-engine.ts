import { prisma } from '@/lib/prisma'
import { suggestFlashDiscountPercentOffList } from '@/lib/azan-pricing'
import { prismaWhereAzanCatalogProducts } from '@/lib/integrations/azan-catalog'
import { invalidateSearchIndex } from '@/lib/search-index'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'
import type { Prisma } from '@prisma/client'

export type FlashRotationResult = {
  run: boolean
  cleared: number
  assigned: number
  detail: string[]
  error?: string
}

function getDhakaStartEndWindow(): { start: Date; end: Date } {
  const now = new Date()
  // Approximate "calendar day" in Asia/Dhaka using fixed offset +6h (no DST in BD)
  const ms = 6 * 60 * 60 * 1000
  const local = new Date(now.getTime() + ms)
  const y = local.getUTCFullYear()
  const m = local.getUTCMonth()
  const d = local.getUTCDate()
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0) - ms)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

/**
 * Nightly: clear auto flash, pick eligible Azan products, set list-based flash with min gross margin.
 * Env: FLASH_AUTO_ENABLED, FLASH_AUTO_MAX_PRODUCTS, FLASH_MIN_GROSS_MARGIN_PERCENT, FLASH_TARGET_DISCOUNT_OFF_LIST
 */
export async function runFlashSaleAutoRotation(): Promise<FlashRotationResult> {
  const raw = (process.env.FLASH_AUTO_ENABLED || '').trim().toLowerCase()
  const enabled = ['1', 'true', 'yes', 'on'].includes(raw)
  const detail: string[] = []

  if (!enabled) {
    return { run: false, cleared: 0, assigned: 0, detail: ['FLASH_AUTO_ENABLED is off; skip.'] }
  }

  const maxProducts = Math.min(
    200,
    Math.max(1, Number.parseInt(process.env.FLASH_AUTO_MAX_PRODUCTS || '20', 10) || 20),
  )
  const minGross = Math.min(
    90,
    Math.max(0, Number.parseFloat(process.env.FLASH_MIN_GROSS_MARGIN_PERCENT || '20') || 20),
  )
  const targetOff = Math.min(
    90,
    Math.max(0, Number.parseFloat(process.env.FLASH_TARGET_DISCOUNT_OFF_LIST || '12') || 12),
  )

  const { start, end } = getDhakaStartEndWindow()

  try {
    const cleared = await prisma.product.updateMany({
      where: { flashSaleSource: 'auto' },
      data: {
        isFlashSale: false,
        flashSalePrice: null,
        flashSaleStart: null,
        flashSaleEnd: null,
        flashSaleSource: null,
      },
    })

    const baseWhere: Prisma.ProductWhereInput = {
      ...prismaWhereAzanCatalogProducts(),
      isActive: true,
      inStock: true,
      stockQuantity: { gt: 0 },
      purchasePrice: { not: null, gt: 0 },
      ...(!isMedicineShopEnabled() ? { type: 'GENERAL' as const } : {}),
      ...(!isGroceryShopEnabled() ? { NOT: { category: { slug: GROCERY_CATEGORY_SLUG } } } : {}),
    }

    const pool = await prisma.product.findMany({
      where: baseWhere,
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        purchasePrice: true,
        popularityScore: true,
        stockQuantity: true,
        supplierSku: true,
      },
      orderBy: [{ popularityScore: 'desc' }, { stockQuantity: 'desc' }],
      take: 500,
    })

    if (pool.length === 0) {
      return {
        run: true,
        cleared: cleared.count,
        assigned: 0,
        detail: ['No eligible Azan products (stock + purchase price).', `Cleared auto rows: ${cleared.count}.`],
      }
    }

    const picked: (typeof pool)[number][] = []
    for (const p of pool) {
      if (picked.length >= maxProducts) break
      const list = p.sellingPrice
      const cost = p.purchasePrice ?? 0
      if (list <= 0 || cost <= 0) continue
      const s = suggestFlashDiscountPercentOffList({
        listPrice: list,
        cost,
        minGrossPercent: minGross,
        targetDiscountPercent: targetOff,
      })
      if (s.discountPercent <= 0) continue
      const flashPrice = Math.max(
        1,
        Math.round((list * (1 - s.discountPercent / 100)) * 100) / 100,
      )
      if (flashPrice >= list) continue
      picked.push(p)
    }

    let assigned = 0
    for (const p of picked) {
      const list = p.sellingPrice
      const cost = p.purchasePrice!
      const s = suggestFlashDiscountPercentOffList({
        listPrice: list,
        cost,
        minGrossPercent: minGross,
        targetDiscountPercent: targetOff,
      })
      const flashPrice = Math.max(
        1,
        Math.round((list * (1 - s.discountPercent / 100)) * 100) / 100,
      )
      await prisma.product.update({
        where: { id: p.id },
        data: {
          isFlashSale: true,
          flashSalePrice: flashPrice,
          flashSaleStart: start,
          flashSaleEnd: end,
          flashSaleSource: 'auto',
        },
      })
      detail.push(
        `${p.name.slice(0, 40)}: −${s.discountPercent.toFixed(1)}% (cap ${s.cappedBy}, est gross ${s.minGrossIfApplied.toFixed(1)}%)`,
      )
      assigned++
    }

    if (assigned > 0) {
      await invalidateSearchIndex()
    }

    return {
      run: true,
      cleared: cleared.count,
      assigned,
      detail: [
        `Window ${start.toISOString()} – ${end.toISOString()}`,
        `min gross ${minGross}%, target off list ${targetOff}%`,
        `Cleared auto: ${cleared.count}, assigned: ${assigned}`,
        ...detail.slice(0, 40),
      ],
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { run: true, cleared: 0, assigned: 0, detail: [], error: message }
  }
}
