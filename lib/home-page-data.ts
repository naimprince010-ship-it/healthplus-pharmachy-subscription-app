import { buildProductWhereClause } from '@/lib/homeSections'
import { getEffectivePrices } from '@/lib/pricing'
import { resolveCategoryIconKey, type CategoryIconKey } from '@/lib/category-icon-key'
import type { SubscriptionPlan } from '@prisma/client'

const PRODUCT_SELECT = {
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
  isFeatured: true,
  category: { select: { id: true, name: true, slug: true } },
  medicine: { select: { discountPercentage: true, packSize: true } },
} as const

function mapHomeProduct(product: any) {
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
}

const BEST_SELLER_KEYS: CategoryIconKey[] = ['skincare', 'makeup', 'hair', 'fragrance']

/** Curated rows used by the beauty/grocery home. Every ranking is based on persisted data. */
export async function getCuratedHomeData() {
  const empty = { flashSale: [], bestSellers: {}, grocery: [], brands: [] }
  try {
    const { prisma } = await import('@/lib/prisma')
    const now = new Date()
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
    })
    const categoryIds = (keys: CategoryIconKey[]) => categories
      .filter((category) => keys.includes(resolveCategoryIconKey(category.slug, category.name)))
      .map((category) => category.id)
    const rankedKeys: CategoryIconKey[] = [...BEST_SELLER_KEYS, 'grocery', 'fresh']
    const rankedQueries = rankedKeys.map((key) => prisma.product.findMany({
      where: { isActive: true, deletedAt: null, type: 'GENERAL', categoryId: { in: categoryIds([key]) } },
      select: {
        ...PRODUCT_SELECT,
        orderItems: {
          where: { order: { createdAt: { gte: since }, status: { not: 'CANCELLED' } } },
          select: { quantity: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { popularityScore: 'desc' }],
      take: 100,
    }))
    const [flashRaw, candidateGroups, brands] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          isFlashSale: true,
          flashSalePrice: { not: null },
          flashSaleStart: { lte: now },
          flashSaleEnd: { gte: now },
        },
        select: {
          ...PRODUCT_SELECT,
          orderItems: {
            where: { order: { createdAt: { gte: since, lte: now }, status: { not: 'CANCELLED' } } },
            select: { quantity: true, order: { select: { createdAt: true } } },
          },
        },
        orderBy: { flashSaleEnd: 'asc' },
        take: 6,
      }),
      Promise.all(rankedQueries),
      prisma.manufacturer.findMany({
        where: { logoUrl: { not: null }, products: { some: { isActive: true, deletedAt: null, type: 'GENERAL' } } },
        select: { id: true, name: true, slug: true, logoUrl: true },
        orderBy: { name: 'asc' },
        take: 8,
      }),
    ])

    const ranked = candidateGroups.flat().map((product) => ({
      product,
      key: resolveCategoryIconKey(product.category.slug, product.category.name),
      sold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    }))
    const choose = (keys: CategoryIconKey[]) => ranked
      .filter((item) => keys.includes(item.key))
      .sort((a, b) => b.sold - a.sold || Number(b.product.isFeatured) - Number(a.product.isFeatured))
      .slice(0, 6)
      .map(({ product }) => mapHomeProduct(product))

    const bestSellers = Object.fromEntries(BEST_SELLER_KEYS.map((key) => [key, choose([key])]))
    const flashSale = flashRaw.map((product) => {
      const sold = product.orderItems
        .filter((item) => !product.flashSaleStart || item.order.createdAt >= product.flashSaleStart)
        .reduce((sum, item) => sum + item.quantity, 0)
      const denominator = sold + product.stockQuantity
      return {
        ...mapHomeProduct(product),
        soldPercentage: sold > 0 && denominator > 0 ? Math.round((sold / denominator) * 100) : null,
      }
    })
    return {
      flashSale,
      bestSellers,
      grocery: choose(['grocery', 'fresh']),
      brands: brands.filter((brand) => Boolean(brand.logoUrl)),
    }
  } catch (error) {
    console.error('Unable to load curated home data', error)
    return empty
  }
}

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
          select: PRODUCT_SELECT,
          take: section.maxProducts,
        })

        const mappedProducts = products.map(mapHomeProduct)

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
