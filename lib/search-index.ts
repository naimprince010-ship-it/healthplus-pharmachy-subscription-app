import Fuse, { IFuseOptions } from 'fuse.js'
import { prisma } from '@/lib/prisma'

export interface SearchableProduct {
  id: string
  type: string
  name: string
  slug: string
  brandName: string | null
  genericName: string | null
  manufacturer: string | null
  categoryName: string
  categorySlug: string
  description: string | null
  sellingPrice: number
  mrp: number | null
  imageUrl: string | null
  discountPercentage: number | null
  popularityScore: number
  isFeatured: boolean
  isMedicine: boolean
  medicineId: string | null
  href: string
}

let searchIndex: Fuse<SearchableProduct> | null = null
let indexedProducts: SearchableProduct[] = []
let lastIndexTime = 0
const INDEX_TTL_MS = 60 * 1000

const fuseOptions: IFuseOptions<SearchableProduct> = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'brandName', weight: 0.2 },
    { name: 'genericName', weight: 0.25 },
    { name: 'manufacturer', weight: 0.1 },
    { name: 'categoryName', weight: 0.05 },
  ],
  threshold: 0.4,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true,
  useExtendedSearch: false,
}

async function loadProducts(): Promise<SearchableProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      category: true,
      medicine: true,
    },
    orderBy: [
      { isFeatured: 'desc' },
      { name: 'asc' },
    ],
  })

  return products.map((p) => {
    const rawProduct = p as typeof p & { popularityScore?: number }
    return {
      id: p.id,
      type: p.type,
      name: p.name,
      slug: p.slug,
      brandName: p.medicine?.manufacturer || p.medicine?.brandName || p.brandName || null,
      genericName: p.medicine?.genericName || null,
      manufacturer: p.medicine?.manufacturer || null,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      description: p.description,
      sellingPrice: p.sellingPrice,
      mrp: p.mrp,
      imageUrl: p.imageUrl,
      discountPercentage: p.discountPercentage || p.medicine?.discountPercentage || null,
      popularityScore: rawProduct.popularityScore ?? 0,
      isFeatured: p.isFeatured,
      isMedicine: p.type === 'MEDICINE',
      medicineId: p.medicine?.id || null,
      href: `/medicines/${p.slug}`,
    }
  })
}

export async function getSearchIndex(): Promise<{
  fuse: Fuse<SearchableProduct>
  products: SearchableProduct[]
}> {
  const now = Date.now()

  if (searchIndex && indexedProducts.length > 0 && now - lastIndexTime < INDEX_TTL_MS) {
    return { fuse: searchIndex, products: indexedProducts }
  }

  indexedProducts = await loadProducts()
  searchIndex = new Fuse(indexedProducts, fuseOptions)
  lastIndexTime = now

  return { fuse: searchIndex, products: indexedProducts }
}

export function invalidateSearchIndex(): void {
  lastIndexTime = 0
}

export interface SearchResult {
  item: SearchableProduct
  score: number
  combinedScore: number
}

export async function searchProducts(
  query: string,
  limit: number = 40
): Promise<SearchResult[]> {
  const { fuse, products } = await getSearchIndex()

  if (!query || query.length < 2) {
    return products.slice(0, limit).map((item) => ({
      item,
      score: 0,
      combinedScore: item.popularityScore,
    }))
  }

  const fuseResults = fuse.search(query, { limit: limit * 2 })

  const maxPopularity = Math.max(...products.map((p) => p.popularityScore), 1)

  const results: SearchResult[] = fuseResults.map((result) => {
    const fuseScore = 1 - (result.score ?? 0)
    const normalizedPopularity = result.item.popularityScore / maxPopularity
    const featuredBonus = result.item.isFeatured ? 0.1 : 0

    const combinedScore = fuseScore * 0.6 + normalizedPopularity * 0.3 + featuredBonus

    return {
      item: result.item,
      score: result.score ?? 0,
      combinedScore,
    }
  })

  results.sort((a, b) => b.combinedScore - a.combinedScore)

  return results.slice(0, limit)
}
