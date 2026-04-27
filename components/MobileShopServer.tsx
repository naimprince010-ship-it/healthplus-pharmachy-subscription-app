import { prisma } from '@/lib/prisma'
import { MobileShop, MobileShopProduct, MobileShopCategorySection } from './MobileShop'
import {
  GROCERY_CATEGORY_SLUG,
  isGroceryShopEnabled,
  isMedicineShopEnabled,
} from '@/lib/site-features'

/** Only columns the shop needs — avoids `SELECT`ing newer schema fields missing on old/local DBs. */
const productForMobileShop = {
  id: true,
  type: true,
  name: true,
  slug: true,
  brandName: true,
  description: true,
  sellingPrice: true,
  mrp: true,
  stockQuantity: true,
  imageUrl: true,
  discountPercentage: true,
  flashSalePrice: true,
  flashSaleStart: true,
  flashSaleEnd: true,
  isFlashSale: true,
  category: { select: { id: true, name: true, slug: true } },
} as const

async function getAllDescendantCategoryIds(parentId: string): Promise<string[]> {
  const children = await prisma.category.findMany({
    where: { parentCategoryId: parentId },
    select: { id: true },
  })
  
  if (children.length === 0) {
    return []
  }
  
  const childIds = children.map(c => c.id)
  const grandchildIds = await Promise.all(
    childIds.map(id => getAllDescendantCategoryIds(id))
  )
  
  return [...childIds, ...grandchildIds.flat()]
}

export async function MobileShopServer() {
  const now = new Date()

  const [flashSaleProductsRaw, sidebarCategoriesRaw] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        isFlashSale: true,
        flashSaleStart: { lte: now },
        flashSaleEnd: { gte: now },
        ...(!isMedicineShopEnabled() ? { type: 'GENERAL' as const } : {}),
        ...(!isGroceryShopEnabled()
          ? { NOT: { category: { slug: GROCERY_CATEGORY_SLUG } } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: productForMobileShop,
    }),
    prisma.category.findMany({
      where: {
        showInSidebar: true,
        isActive: true,
      },
      orderBy: {
        sidebarOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sidebarIconUrl: true,
        sidebarLinkUrl: true,
        isMedicineCategory: true,
      },
    }),
  ])

  const sidebarCategories = sidebarCategoriesRaw.filter((c) => {
    if (!isMedicineShopEnabled() && c.isMedicineCategory) return false
    if (!isGroceryShopEnabled() && c.slug === GROCERY_CATEGORY_SLUG) return false
    return true
  })

  const flashSaleProducts: MobileShopProduct[] = flashSaleProductsRaw.map(p => ({
    id: p.id,
    type: p.type as 'MEDICINE' | 'GENERAL',
    name: p.name,
    slug: p.slug,
    brandName: p.brandName,
    description: p.description,
    sellingPrice: p.sellingPrice,
    mrp: p.mrp ?? null,
    stockQuantity: p.stockQuantity,
    imageUrl: p.imageUrl,
    discountPercentage: p.discountPercentage ?? null,
    flashSalePrice: p.flashSalePrice ?? null,
    flashSaleStart: p.flashSaleStart,
    flashSaleEnd: p.flashSaleEnd,
    isFlashSale: p.isFlashSale,
    category: p.category,
  }))

  const limitedCategories = sidebarCategories.slice(0, 8)

  const categoryProductsResults = await Promise.all(
    limitedCategories.map(async (category) => {
      const descendantIds = await getAllDescendantCategoryIds(category.id)
      const categoryIds = [category.id, ...descendantIds]

      const products = await prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          isActive: true,
          deletedAt: null,
          ...(!isMedicineShopEnabled() ? { type: 'GENERAL' as const } : {}),
          ...(!isGroceryShopEnabled()
            ? { NOT: { category: { slug: GROCERY_CATEGORY_SLUG } } }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: productForMobileShop,
      })

      return {
        category,
        products: products.map(p => ({
          id: p.id,
          type: p.type as 'MEDICINE' | 'GENERAL',
          name: p.name,
          slug: p.slug,
          brandName: p.brandName,
          description: p.description,
          sellingPrice: p.sellingPrice,
          mrp: p.mrp ?? null,
          stockQuantity: p.stockQuantity,
          imageUrl: p.imageUrl,
          discountPercentage: p.discountPercentage ?? null,
          flashSalePrice: p.flashSalePrice ?? null,
          flashSaleStart: p.flashSaleStart,
          flashSaleEnd: p.flashSaleEnd,
          isFlashSale: p.isFlashSale,
          category: p.category,
        })),
      }
    })
  )

  const categorySections: MobileShopCategorySection[] = categoryProductsResults.filter(
    section => section.products.length > 0
  )

  return (
    <MobileShop
      categoryGrid={sidebarCategories}
      flashSaleProducts={flashSaleProducts}
      categorySections={categorySections}
    />
  )
}
