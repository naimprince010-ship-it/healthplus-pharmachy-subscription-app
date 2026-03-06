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
  stockQuantity: number
  imageUrl: string | null
  discountPercentage: number | null
  popularityScore: number
  isFeatured: boolean
  isMedicine: boolean
  medicineId: string | null
  href: string
  sizeLabel: string | null
}

export interface SearchResult {
  item: SearchableProduct
  score: number // Kept for compatibility, though PG FTS score might be different or we can mock it
  combinedScore: number
}

function mapToSearchableProduct(p: any): SearchableProduct {
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
    stockQuantity: p.stockQuantity,
    imageUrl: p.imageUrl,
    discountPercentage: p.discountPercentage || p.medicine?.discountPercentage || null,
    popularityScore: p.popularityScore ?? 0,
    isFeatured: p.isFeatured,
    isMedicine: p.type === 'MEDICINE',
    medicineId: p.medicine?.id || null,
    href: `/products/${p.slug}`,
    sizeLabel: p.sizeLabel || null,
  }
}

// Replaces getSearchIndex() for the no-query fallback
export async function getTopProducts(limit: number = 40): Promise<{ products: SearchableProduct[] }> {
  try {
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
        { popularityScore: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
    })

    return { products: products.map(mapToSearchableProduct) }
  } catch (error) {
    console.error('Error fetching top products:', error)
    return { products: [] }
  }
}

/**
 * Kept for backward compatibility with route.js that might call getSearchIndex instead of getTopProducts
 */
export async function getSearchIndex(): Promise<{ products: SearchableProduct[] }> {
  return getTopProducts(40)
}

export function invalidateSearchIndex(): void {
  // No-op. Prisma handles real-time queries.
}

export async function searchProducts(
  query: string,
  limit: number = 40
): Promise<SearchResult[]> {
  if (!query || query.length < 2) {
    const { products } = await getTopProducts(limit)
    return products.map((item) => ({
      item,
      score: 1, // Max score for exact
      combinedScore: item.popularityScore,
    }))
  }

  // Sanitize query to break into valid Postgres FTS term
  // Format query as word1 | word2 | word3:* for prefix searching
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((word) => word.length > 0)

  if (terms.length === 0) {
    const { products } = await getTopProducts(limit)
    return products.map((item) => ({ item, score: 1, combinedScore: item.popularityScore }))
  }

  // Join with OR (|) and add prefix matching (:*) to each term
  const ftsQuery = terms.map((term) => `${term}:*`).join(' | ')

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { search: ftsQuery } },
          { brandName: { search: ftsQuery } },
          { description: { search: ftsQuery } },
          { medicine: { genericName: { search: ftsQuery } } },
          { medicine: { manufacturer: { search: ftsQuery } } },
        ],
      },
      include: {
        category: true,
        medicine: true,
      },
      take: limit * 2, // Fetch more to post-sort by our combined score
    })

    // If FTS fails to find anything (maybe language issue or strictly formatted prefixes), fallback to basic ILIKE
    if (products.length === 0) {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          OR: [
            ...terms.map((term) => ({
              name: { contains: term, mode: 'insensitive' as const }
            })),
            ...terms.map((term) => ({
              medicine: { genericName: { contains: term, mode: 'insensitive' as const } }
            }))
          ]
        },
        include: {
          category: true,
          medicine: true,
        },
        take: limit * 2,
      })
      products.push(...fallbackProducts)
    }

    const maxPopularity = Math.max(...products.map((p: any) => p.popularityScore ?? 0), 1)

    const searchResults: SearchResult[] = products.map((p) => {
      const item = mapToSearchableProduct(p)

      // Calculate a pseudo-score (Postgres FTS doesn't return score in standard Prisma client yet)
      const rawPopularity = (p as any).popularityScore ?? 0
      const normalizedPopularity = rawPopularity / maxPopularity
      const featuredBonus = item.isFeatured ? 0.1 : 0

      // Match quality heuristic (exact startsWith > contains)
      const exactMatch = item.name.toLowerCase().startsWith(query.toLowerCase()) ? 0.9 : 0.6

      const combinedScore = exactMatch * 0.6 + normalizedPopularity * 0.3 + featuredBonus

      return {
        item,
        score: exactMatch,
        combinedScore,
      }
    })

    // Sort by combined score
    searchResults.sort((a, b) => b.combinedScore - a.combinedScore)

    return searchResults.slice(0, limit)
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}
