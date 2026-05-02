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

/** Home section rows + product cards (server-priced for ProductCard hydration). */
export async function getHomeSections() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const sections = await prisma.homeSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const whereClause = buildProductWhereClause(section)
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
              },
            },
          },
          take: section.maxProducts,
        })

        const mappedProducts = products.map((product) => {
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
            effectivePrice: effectivePrices.price,
            effectiveMrp: effectivePrices.mrp,
            effectiveDiscountPercent: effectivePrices.discountPercent,
            isFlashSaleActive: effectivePrices.isFlashSale,
            isCampaignActive: effectivePrices.isCampaign,
          }
        })

        return {
          section: {
            id: section.id,
            title: section.title,
            slug: section.slug,
            badgeText: section.badgeText,
            bgColor: section.bgColor,
          },
          products: mappedProducts,
        }
      })
    )

    return sectionsWithProducts.filter((s) => s.products.length > 0)
  } catch {
    return []
  }
}
