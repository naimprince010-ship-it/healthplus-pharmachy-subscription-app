import { prisma } from '@/lib/prisma'
import { MobileShop, MobileShopProduct, MobileShopCategorySection } from './MobileShop'

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

  const [flashSaleProductsRaw, sidebarCategories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        isFlashSale: true,
        flashSaleStart: { lte: now },
        flashSaleEnd: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
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
      },
    }),
  ])

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
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
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
      flashSaleProducts={flashSaleProducts}
      categorySections={categorySections}
    />
  )
}
