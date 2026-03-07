import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getCachedData, setCachedData, invalidateCache } from '@/lib/cache'

const CACHE_KEY_TOP_PRODUCTS = 'search:top-products'
const CACHE_TTL_TOP_PRODUCTS = 60 * 60 * 24 // 24 hours
const CACHE_TTL_SEARCH = 60 * 60 // 1 hour

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
  isFuzzyMatch?: boolean
  originalQuery?: string
  correctedQuery?: string
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
    const cached = await getCachedData<{ products: SearchableProduct[] }>(CACHE_KEY_TOP_PRODUCTS)
    if (cached && cached.products && cached.products.length > 0) {
      // Respect the limit even with cached data
      return { products: cached.products.slice(0, limit) }
    }

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

    const result = { products: products.map(mapToSearchableProduct) }
    await setCachedData(CACHE_KEY_TOP_PRODUCTS, result, CACHE_TTL_TOP_PRODUCTS)

    // Always return slice of the whole mapped array
    return { products: result.products.slice(0, limit) }
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
  // Clear the top products cache.
  // We can't easily clear all search permutations, but they expire in 1 hr.
  invalidateCache(CACHE_KEY_TOP_PRODUCTS).catch(console.error)
}

export async function searchProducts(
  query: string,
  limit: number = 40,
  isRetry: boolean = false
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
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((word) => word.length > 0)

  if (terms.length === 0) {
    const { products } = await getTopProducts(limit)
    return products.map((item) => ({ item, score: 1, combinedScore: item.popularityScore }))
  }

  const cacheKey = `search:query:${terms.join('-').toLowerCase()}:${limit}`
  const cachedResults = await getCachedData<SearchResult[]>(cacheKey)
  if (cachedResults) return cachedResults

  // Join with OR (|) and add prefix matching (:*) to each term
  const ftsQuery = terms.map((term) => `${term}:*`).join(' | ')

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { search: ftsQuery } } as any,
          { brandName: { search: ftsQuery } } as any,
          { description: { search: ftsQuery } } as any,
          { medicine: { genericName: { search: ftsQuery } } } as any,
          { medicine: { manufacturer: { search: ftsQuery } } } as any,
          { medicine: { uses: { search: ftsQuery } } } as any,
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
            })),
            ...terms.map((term) => ({
              medicine: { uses: { contains: term, mode: 'insensitive' as const } }
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
    let finalResults = searchResults.slice(0, limit)

    // --- NEW: Fuzzy Logic Fallback ---
    // If we still have 0 results, let's try a very basic fuzzy match against known names/generics
    if (finalResults.length === 0 && query.length > 3 && !isRetry) {
      const fuzzyMatch = await findFuzzyMatch(query)
      if (fuzzyMatch && fuzzyMatch.toLowerCase() !== query.toLowerCase()) {
        // Recursively call search with the corrected term, but prevent infinite loop
        const correctedResults = await searchProducts(fuzzyMatch, limit, true)
        if (correctedResults.length > 0) {
          return correctedResults.map(r => ({
            ...r,
            isFuzzyMatch: true,
            originalQuery: query,
            correctedQuery: fuzzyMatch
          }))
        }
      }
    }
    // ---------------------------------

    // Store in Redis
    await setCachedData(cacheKey, finalResults, CACHE_TTL_SEARCH)

    return finalResults
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}

/**
 * Very basic Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}

const CACHE_KEY_SEARCH_DICTIONARY = 'search:dictionary'

async function findFuzzyMatch(query: string): Promise<string | null> {
  try {
    const q = query.toLowerCase()

    // Get dictionary of names (cached)
    let dictionary = await getCachedData<string[]>(CACHE_KEY_SEARCH_DICTIONARY)

    if (!dictionary) {
      // Build dictionary from top products and generics
      const [products, medicines] = await Promise.all([
        prisma.product.findMany({ select: { name: true }, take: 1000 }),
        prisma.medicine.findMany({ select: { genericName: true }, where: { genericName: { not: null } }, take: 500 })
      ])

      const names = new Set<string>()
      products.forEach(p => names.add(p.name))
      medicines.forEach(m => m.genericName && names.add(m.genericName))

      dictionary = Array.from(names)
      await setCachedData(CACHE_KEY_SEARCH_DICTIONARY, dictionary, 60 * 60 * 12) // 12 hours
    }

    let bestMatch: string | null = null
    let minDistance = 3 // Only consider matches with distance <= 2 for accuracy

    for (const name of dictionary) {
      const distance = levenshteinDistance(q, name.toLowerCase())
      if (distance < minDistance) {
        minDistance = distance
        bestMatch = name
        if (minDistance === 1) break // Good enough
      }
    }

    return bestMatch
  } catch (error) {
    console.error('Fuzzy match failed:', error)
    return null
  }
}
