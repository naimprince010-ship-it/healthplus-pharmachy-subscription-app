import { buildProductWhereClause } from '@/lib/homeSections'
import { getEffectivePrices } from '@/lib/pricing'
import type { SubscriptionPlan } from '@prisma/client'

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      take: 4,
    })
  } catch {
    return []
  }
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function rotateProducts<T extends { id: string }>(products: T[], seed: string): T[] {
  if (products.length < 2) return products
  const offset = hashString(seed) % products.length
  return [...products.slice(offset), ...products.slice(0, offset)]
}

function orderManualProducts<T extends { id: string }>(products: T[], productIds: unknown): T[] {
  if (!Array.isArray(productIds)) return products
  const position = new Map(productIds.map((id, index) => [String(id), index]))
  return [...products].sort((a, b) => (position.get(a.id) ?? 99999) - (position.get(b.id) ?? 99999))
}

function pickVisibleProducts<T extends { id: string }>(
  products: T[],
  maxProducts: number,
  usedProductIds: Set<string>,
): T[] {
  const fresh = products.filter((product) => !usedProductIds.has(product.id))
  const picked = fresh.length >= maxProducts ? fresh.slice(0, maxProducts) : products.slice(0, maxProducts)
  for (const product of picked) usedProductIds.add(product.id)
  return picked
}

/** Home section rows + product cards (server-priced for ProductCard hydration). */
export async function getHomeSections() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const sections = await prisma.homeSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    const sectionsWithProducts = []
    const usedProductIds = new Set<string>()
    const rotationBucket = Math.floor(Date.now() / (60 * 60 * 1000))

    for (const section of sections) {
      const whereClause = buildProductWhereClause(section)
      const maxProducts = Math.max(1, section.maxProducts)
      const poolSize =
        section.filterType === 'manual'
          ? Math.max(maxProducts, Array.isArray(section.productIds) ? section.productIds.length : maxProducts)
          : Math.min(Math.max(maxProducts * 5, maxProducts + 12), 80)

      const products = await prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          sellingPrice: true,
          mrp: true,
          stockQuantity: true,
          brandName: true,
          sizeLabel: true,
          description: true,
          type: true,
          discountPercentage: true,
          flashSalePrice: true,
          flashSaleStart: true,
          flashSaleEnd: true,
          isFlashSale: true,
          campaignPrice: true,
          campaignStart: true,
          campaignEnd: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          medicine: {
            select: {
              discountPercentage: true,
              packSize: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { popularityScore: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: poolSize,
      })

      const orderedProducts =
        section.filterType === 'manual'
          ? orderManualProducts(products, section.productIds)
          : rotateProducts(products, `${section.slug}:${rotationBucket}`)

      const visibleProducts = pickVisibleProducts(orderedProducts, maxProducts, usedProductIds)

      const mappedProducts = visibleProducts.map((product) => {
        const rawDiscount = product.discountPercentage ?? product.medicine?.discountPercentage
        const discountPercentage = rawDiscount ? Number(rawDiscount) : null

        const effectivePrices = getEffectivePrices({
          sellingPrice: Number(product.sellingPrice),
          mrp: product.mrp ? Number(product.mrp) : null,
          discountPercentage,
          flashSalePrice: product.flashSalePrice ? Number(product.flashSalePrice) : null,
          flashSaleStart: product.flashSaleStart,
          flashSaleEnd: product.flashSaleEnd,
          isFlashSale: product.isFlashSale,
          campaignPrice: product.campaignPrice ? Number(product.campaignPrice) : null,
          campaignStart: product.campaignStart,
          campaignEnd: product.campaignEnd,
        })

        return {
          ...product,
          discountPercentage,
          packSize: product.medicine?.packSize ?? null,
          effectivePrice: effectivePrices.price,
          effectiveMrp: effectivePrices.mrp,
          effectiveDiscountPercent: effectivePrices.discountPercent,
          isFlashSaleActive: effectivePrices.isFlashSale,
          isCampaignActive: effectivePrices.isCampaign,
        }
      })

      sectionsWithProducts.push({
        section: {
          id: section.id,
          title: section.title,
          slug: section.slug,
          badgeText: section.badgeText,
          bgColor: section.bgColor,
        },
        products: mappedProducts,
      })
    }

    return sectionsWithProducts.filter((s) => s.products.length > 0)
  } catch {
    return []
  }
}
