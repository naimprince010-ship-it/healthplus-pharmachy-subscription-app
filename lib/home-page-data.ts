import { buildProductWhereClause } from '@/lib/homeSections'
import { getEffectivePrices } from '@/lib/pricing'
import { resolveCategoryIconKey, type CategoryIconKey } from '@/lib/category-icon-key'
import type { SubscriptionPlan } from '@prisma/client'
import { isGroceryShopEnabled } from '@/lib/site-features'

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
  createdAt: true,
  category: { select: { id: true, name: true, slug: true, isMedicineCategory: true } },
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
const SKIN_TYPES = [
  { label: 'তৈলাক্ত', query: 'oily skin', terms: ['oily', 'oil control', 'sebum'] },
  { label: 'শুষ্ক', query: 'dry skin', terms: ['dry skin', 'hydrating', 'moisturizing'] },
  { label: 'মিশ্র', query: 'combination skin', terms: ['combination skin'] },
  { label: 'সংবেদনশীল', query: 'sensitive skin', terms: ['sensitive', 'gentle', 'soothing'] },
  { label: 'ব্রণপ্রবণ', query: 'acne', terms: ['acne', 'blemish', 'pimple'] },
] as const

/** Curated rows used by the beauty/grocery home. Every ranking is based on persisted data. */
export async function getCuratedHomeData() {
  const empty = { flashSale: [], skinTypes: [], bestSellers: {}, bestSellerTitle: 'জনপ্রিয় পণ্য' as const, grocery: [], brands: [] }
  try {
    const { prisma } = await import('@/lib/prisma')
    const now = new Date()
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, isMedicineCategory: true },
    })
    const categoryIds = (keys: CategoryIconKey[]) => categories
      .filter((category) => !category.isMedicineCategory && keys.includes(resolveCategoryIconKey(category.slug, category.name)))
      .map((category) => category.id)
    const rankedKeys: CategoryIconKey[] = [...BEST_SELLER_KEYS, 'grocery', 'fresh']
    const rankedQueries = rankedKeys.map((key) => prisma.product.findMany({
      where: { isActive: true, deletedAt: null, type: 'GENERAL', stockQuantity: { gt: 0 }, category: { isMedicineCategory: false }, categoryId: { in: categoryIds([key]) } },
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
    const [flashRaw, candidateGroups, brands, skinTypeCounts] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          type: 'GENERAL',
          category: { isMedicineCategory: false },
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
        take: 5,
      }),
      Promise.all(rankedQueries),
      prisma.manufacturer.findMany({
        where: { products: { some: { isActive: true, deletedAt: null, type: 'GENERAL', category: { isMedicineCategory: false } } } },
        select: { id: true, name: true, slug: true, logoUrl: true },
        orderBy: { name: 'asc' },
        take: 8,
      }),
      Promise.all(SKIN_TYPES.map((skinType) => prisma.product.count({
        where: {
          isActive: true,
          deletedAt: null,
          type: 'GENERAL',
          category: { isMedicineCategory: false },
          OR: skinType.terms.flatMap((term) => [
            { name: { contains: term, mode: 'insensitive' as const } },
            { description: { contains: term, mode: 'insensitive' as const } },
          ]),
        },
      }))),
    ])

    const ranked = candidateGroups.flat().map((product) => ({
      product,
      key: resolveCategoryIconKey(product.category.slug, product.category.name),
      sold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    }))
    const hasAnyBestSellerSales = candidateGroups.flat().some((product) => product.orderItems.some((item) => item.quantity > 0))
    const choose = (keys: CategoryIconKey[], requireSales = false) => {
      const candidates = ranked.filter((item) => keys.includes(item.key))
      return (requireSales && hasAnyBestSellerSales ? candidates.filter((item) => item.sold > 0) : candidates)
      .sort((a, b) => hasAnyBestSellerSales
        ? b.sold - a.sold || Number(b.product.isFeatured) - Number(a.product.isFeatured)
        : b.product.createdAt.getTime() - a.product.createdAt.getTime())
      .slice(0, 10)
      .map(({ product }) => mapHomeProduct(product))
    }

    const bestSellers = Object.fromEntries(BEST_SELLER_KEYS.map((key) => [key, choose([key], true)]))
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
      skinTypes: SKIN_TYPES.map((skinType, index) => ({ ...skinType, count: skinTypeCounts[index] }))
        .filter((skinType) => skinType.count > 0)
        .map(({ label, query, count }) => ({ label, query, count })),
      bestSellers,
      bestSellerTitle: hasAnyBestSellerSales ? 'সবচেয়ে বেশি বিক্রি' as const : 'জনপ্রিয় পণ্য' as const,
      grocery: isGroceryShopEnabled() ? choose(['grocery', 'fresh']) : [],
      brands,
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
              isMedicineCategory: true,
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

      const mappedProducts = visibleProducts
        .filter((product) => product.type !== 'MEDICINE' && !product.category.isMedicineCategory)
        .map((product) => {
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

    return sectionsWithProducts.filter((s) => s.products.length >= 2)
  } catch {
    return []
  }
}
