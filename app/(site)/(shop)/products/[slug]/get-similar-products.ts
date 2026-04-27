import { getEffectivePrices } from '@/lib/pricing'

export interface SimilarProduct {
  id: string
  type: 'MEDICINE' | 'GENERAL'
  name: string
  slug: string
  brandName: string | null
  description: string | null
  sellingPrice: number
  mrp: number | null
  stockQuantity: number
  imageUrl: string | null
  discountPercentage: number | null
  flashSalePrice: number | null
  flashSaleStart: string | null
  flashSaleEnd: string | null
  isFlashSale: boolean | null
  category: {
    id: string
    name: string
    slug: string
  }
  effectivePrice: number
  effectiveMrp: number
  effectiveDiscountPercent: number
  isFlashSaleActive: boolean
  cartInfo: { kind: 'product'; productId: string }
}

export async function getSimilarProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any,
  productId: string,
  categoryId: string | null,
  _brandName: string | null,
): Promise<SimilarProduct[]> {
  if (!categoryId) return []

  try {
    const rawProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        categoryId: categoryId,
        isActive: true,
      },
      select: {
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
      },
      take: 10,
      orderBy: {
        sellingPrice: 'asc',
      },
    })

    const mapped = rawProducts.map((p: any) => {
      try {
        if (!p || !p.id || !p.slug || !p.name) {
          console.error('similarProducts: missing required fields for product', p?.id)
          return null
        }

        if (!p.category || !p.category.id || !p.category.name || !p.category.slug) {
          console.error('similarProducts: missing category for product', p.id)
          return null
        }

        const sellingPrice = Number(p.sellingPrice)
        if (isNaN(sellingPrice) || sellingPrice <= 0) {
          console.error('similarProducts: invalid sellingPrice for product', p.id)
          return null
        }

        const prices = getEffectivePrices({
          sellingPrice: sellingPrice,
          mrp: p.mrp != null ? Number(p.mrp) : null,
          discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : null,
          flashSalePrice: p.flashSalePrice != null ? Number(p.flashSalePrice) : null,
          flashSaleStart: p.flashSaleStart,
          flashSaleEnd: p.flashSaleEnd,
          isFlashSale: p.isFlashSale,
          campaignPrice: p.campaignPrice != null ? Number(p.campaignPrice) : null,
          campaignStart: p.campaignStart,
          campaignEnd: p.campaignEnd,
        })

        return {
          id: p.id,
          type: (p.type || 'GENERAL') as 'MEDICINE' | 'GENERAL',
          name: p.name,
          slug: p.slug,
          brandName: p.brandName ?? null,
          description: p.description ?? null,
          sellingPrice: sellingPrice,
          mrp: p.mrp != null ? Number(p.mrp) : null,
          stockQuantity: Number(p.stockQuantity ?? 0),
          imageUrl: p.imageUrl ?? null,
          discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : null,
          flashSalePrice: p.flashSalePrice != null ? Number(p.flashSalePrice) : null,
          flashSaleStart: p.flashSaleStart ? new Date(p.flashSaleStart).toISOString() : null,
          flashSaleEnd: p.flashSaleEnd ? new Date(p.flashSaleEnd).toISOString() : null,
          isFlashSale: p.isFlashSale ?? false,
          category: p.category,
          effectivePrice: prices.price,
          effectiveMrp: prices.mrp,
          effectiveDiscountPercent: prices.discountPercent,
          isFlashSaleActive: prices.isFlashSale,
          cartInfo: { kind: 'product' as const, productId: p.id },
        } as SimilarProduct
      } catch (err) {
        console.error('similarProducts: failed to map product', p?.id, err)
        return null
      }
    })

    return mapped.filter((p: SimilarProduct | null): p is SimilarProduct => p !== null)
  } catch (error) {
    console.error('Error fetching similar products:', error)
    return []
  }
}
