import { cache } from 'react'

/**
 * Single Prisma read per request: generateMetadata and the page both call this.
 * React cache() deduplicates so we avoid the duplicate findUnique the route used to run.
 */
export const getCachedProductBySlug = cache(async (slug: string) => {
  const { prisma } = await import('@/lib/prisma')
  return prisma.product.findUnique({
    where: { slug },
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
      keyFeatures: true,
      specSummary: true,
      ingredients: true,
      sizeLabel: true,
      variantLabel: true,
      unit: true,
      type: true,
      isActive: true,
      discountPercentage: true,
      flashSalePrice: true,
      flashSaleStart: true,
      flashSaleEnd: true,
      isFlashSale: true,
      campaignPrice: true,
      campaignStart: true,
      campaignEnd: true,
      supplierSku: true,
      sourceCategoryName: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parentCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      manufacturer: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      medicine: {
        select: {
          discountPercentage: true,
          genericName: true,
          dosageForm: true,
          strength: true,
          manufacturer: true,
          unitPrice: true,
          stripPrice: true,
          tabletsPerStrip: true,
        },
      },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          variantName: true,
          unitLabel: true,
          sizeLabel: true,
          mrp: true,
          sellingPrice: true,
          discountPercentage: true,
          stockQuantity: true,
          isDefault: true,
        },
      },
    },
  })
})
