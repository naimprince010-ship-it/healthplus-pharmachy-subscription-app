import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getCachedData, setCachedData, invalidateCache } from '@/lib/cache'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'

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
  packSize: string | null
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
    packSize: p.medicine?.packSize ?? null,
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
        ...(!isMedicineShopEnabled() ? { type: 'GENERAL' as const } : {}),
        ...(!isGroceryShopEnabled()
          ? { NOT: { category: { slug: GROCERY_CATEGORY_SLUG } } }
          : {}),
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

function filterSearchResultsByRetailScope(results: SearchResult[]): SearchResult[] {
  return results.filter((r) => {
    if (!isMedicineShopEnabled() && r.item.isMedicine) return false
    if (!isGroceryShopEnabled() && r.item.categorySlug === GROCERY_CATEGORY_SLUG) return false
    return true
  })
}

/** Latin / numeric tokens only — used for Postgres FTS prefix query. */
function ftsTermsFromQuery(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((word) => word.length > 0)
}

/**
 * Single-digit-only FTS tokens (e.g. shade "4") match almost every product ("400g", "4-8 kg")
 * under OR tsquery, flooding results and hiding real matches. Drop them from FTS only.
 */
function ftsTermsForPostgres(query: string): string[] {
  return ftsTermsFromQuery(query).filter((t) => !/^\d$/.test(t))
}

/**
 * Terms for ILIKE `contains`. If FTS stripped everything (e.g. Bangla-only),
 * search the whole trimmed phrase on name / slug / brand / description.
 */
function containsTermsFromQuery(query: string): string[] {
  const raw = query.trim()
  if (raw.length < 2) return []
  const fts = ftsTermsFromQuery(query)
  if (fts.length > 0) return fts
  return [raw]
}

function buildIlikeOr(terms: string[]): Prisma.ProductWhereInput[] {
  const ors: Prisma.ProductWhereInput[] = []
  for (const term of terms) {
    // Single-digit contains matches almost every catalog row (prices, pack sizes); skip for ILIKE.
    if (/^\d$/.test(term)) continue
    ors.push(
      { name: { contains: term, mode: 'insensitive' } },
      { slug: { contains: term, mode: 'insensitive' } },
      { brandName: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { medicine: { genericName: { contains: term, mode: 'insensitive' } } },
      { medicine: { uses: { contains: term, mode: 'insensitive' } } }
    )
  }
  return ors
}

export async function searchProducts(
  query: string,
  limit: number = 40,
  isRetry: boolean = false
): Promise<SearchResult[]> {
  const rawQuery = query.trim()
  if (!rawQuery || rawQuery.length < 2) {
    const { products } = await getTopProducts(limit)
    return filterSearchResultsByRetailScope(
      products.map((item) => ({
        item,
        score: 1, // Max score for exact
        combinedScore: item.popularityScore,
      })),
    )
  }

  const ftsTerms = ftsTermsForPostgres(rawQuery)
  const containsTerms = containsTermsFromQuery(rawQuery)

  if (containsTerms.length === 0) {
    const { products } = await getTopProducts(limit)
    return filterSearchResultsByRetailScope(
      products.map((item) => ({ item, score: 1, combinedScore: item.popularityScore })),
    )
  }

  const cacheKey = `search:query:v3:${rawQuery.toLowerCase()}:${limit}`
  const cachedResults = await getCachedData<SearchResult[]>(cacheKey)
  if (cachedResults) return filterSearchResultsByRetailScope(cachedResults)

  try {
    let products: any[] = []

    // Strong signal: whole query (normalized) appears in title — avoids OR-token flooding (e.g. "Hair").
    const phrase = rawQuery
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
    if (phrase.length >= 3) {
      const phraseRows = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          name: { contains: phrase, mode: 'insensitive' },
        },
        include: { category: true, medicine: true },
        take: limit,
      })
      for (const p of phraseRows) {
        products.push(p)
      }
    }

    if (ftsTerms.length > 0) {
      const ftsQuery = ftsTerms.map((term) => `${term}:*`).join(' | ')
      const ftsRows = await prisma.product.findMany({
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
        take: limit * 4,
      })
      const seenFts = new Set(products.map((p: { id: string }) => p.id))
      for (const p of ftsRows) {
        if (!seenFts.has(p.id)) {
          seenFts.add(p.id)
          products.push(p)
        }
      }
    }

    // Always merge ILIKE + slug: OR-FTS + `take` returns an arbitrary slice; noisy tokens like
    // `4:*` used to flood FTS so the real product never appeared. ILIKE finds title/substring matches.
    const ilikeOrs = buildIlikeOr(containsTerms)
    const slugOrs = containsTerms
      .filter((term) => !/^\d$/.test(term))
      .map((term) => ({ slug: { contains: term, mode: 'insensitive' as const } }))
    const combinedOr = [...ilikeOrs, ...slugOrs]

    let fallbackProducts: any[] = []
    if (combinedOr.length > 0) {
      fallbackProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          OR: combinedOr,
        },
        include: {
          category: true,
          medicine: true,
        },
        take: limit * 4,
      })
    }
    const seen = new Set<string>()
    for (const p of products) seen.add(p.id)
    for (const p of fallbackProducts) {
      if (!seen.has(p.id)) {
        seen.add(p.id)
        products.push(p)
      }
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
      const phraseBoost =
        phrase.length >= 3 && item.name.toLowerCase().includes(phrase.toLowerCase()) ? 0.35 : 0

      const combinedScore = phraseBoost + exactMatch * 0.6 + normalizedPopularity * 0.3 + featuredBonus

      return {
        item,
        score: exactMatch,
        combinedScore,
      }
    })

    // Sort by combined score
    searchResults.sort((a, b) => b.combinedScore - a.combinedScore)
    let finalResults = filterSearchResultsByRetailScope(searchResults).slice(0, limit)

    // --- NEW: Fuzzy Logic Fallback ---
    // If we still have 0 results, let's try a very basic fuzzy match against known names/generics
    if (finalResults.length === 0 && query.length > 3 && !isRetry) {
      const fuzzyMatch = await findFuzzyMatch(query)
      if (fuzzyMatch && fuzzyMatch.toLowerCase() !== query.toLowerCase()) {
        // Recursively call search with the corrected term, but prevent infinite loop
        const correctedResults = await searchProducts(fuzzyMatch, limit, true)
        if (correctedResults.length > 0) {
          return filterSearchResultsByRetailScope(
            correctedResults.map((r) => ({
              ...r,
              isFuzzyMatch: true,
              originalQuery: query,
              correctedQuery: fuzzyMatch,
            })),
          )
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
 * Fast prefix search for very short queries (e.g. single-character input).
 * This keeps suggestions useful without flooding results with unrelated contains matches.
 */
export async function searchProductsByPrefix(
  query: string,
  limit: number = 20,
): Promise<SearchResult[]> {
  const rawQuery = query.trim()
  if (!rawQuery) return []

  try {
    const rows = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { startsWith: rawQuery, mode: 'insensitive' as const } },
          { slug: { startsWith: rawQuery, mode: 'insensitive' as const } },
          { brandName: { startsWith: rawQuery, mode: 'insensitive' as const } },
        ],
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
      take: limit * 3,
    })

    const mapped: SearchResult[] = rows.map((p) => {
      const item = mapToSearchableProduct(p)
      const startsName = item.name.toLowerCase().startsWith(rawQuery.toLowerCase())
      const startsBrand = (item.brandName || '').toLowerCase().startsWith(rawQuery.toLowerCase())
      const score = startsName ? 1 : startsBrand ? 0.8 : 0.7
      return {
        item,
        score,
        combinedScore: score + (item.popularityScore ?? 0) / 100000,
      }
    })

    mapped.sort((a, b) => b.combinedScore - a.combinedScore)
    return filterSearchResultsByRetailScope(mapped).slice(0, limit)
  } catch (error) {
    console.error('Prefix search failed:', error)
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
