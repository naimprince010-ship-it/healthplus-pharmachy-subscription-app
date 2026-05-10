import type { SearchProvider } from './types'
import type { SearchResult, SearchableProduct } from '@/lib/search-index'
import { dbSearchProvider } from './db-search-provider'

type EngineHit = {
  _score?: number
  _source?: Partial<SearchableProduct> & Record<string, unknown>
}

type EngineResponse = {
  hits?: {
    hits?: EngineHit[]
  }
}

type MeiliHit = Partial<SearchableProduct> & Record<string, unknown>

type MeiliResponse = {
  hits?: MeiliHit[]
}

const DEFAULT_TIMEOUT_MS = 2500

function getEngineConfig() {
  const endpoint = (process.env.SEARCH_ENGINE_ENDPOINT || '').trim().replace(/\/+$/, '')
  const index = (process.env.SEARCH_ENGINE_INDEX || 'products').trim()
  const apiKey = (process.env.SEARCH_ENGINE_API_KEY || '').trim()
  const timeoutMs = Number(process.env.SEARCH_ENGINE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
  const type = (process.env.SEARCH_ENGINE_TYPE || 'opensearch').trim().toLowerCase()
  return { endpoint, index, apiKey, timeoutMs, type }
}

function buildHeaders(apiKey: string, type: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!apiKey) return headers

  headers.Authorization = type === 'meilisearch' ? `Bearer ${apiKey}` : `ApiKey ${apiKey}`
  return headers
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function mapEngineHitToSearchable(source: Partial<SearchableProduct> & Record<string, unknown>): SearchableProduct | null {
  if (!source.id || !source.slug || !source.name) return null

  const categoryName = typeof source.categoryName === 'string' ? source.categoryName : ''
  const categorySlug = typeof source.categorySlug === 'string' ? source.categorySlug : ''
  const href =
    typeof source.href === 'string' && source.href.trim().length > 0
      ? source.href
      : `/products/${String(source.slug)}`

  return {
    id: String(source.id),
    type: String(source.type || 'GENERAL'),
    name: String(source.name),
    slug: String(source.slug),
    brandName: typeof source.brandName === 'string' ? source.brandName : null,
    genericName: typeof source.genericName === 'string' ? source.genericName : null,
    manufacturer: typeof source.manufacturer === 'string' ? source.manufacturer : null,
    categoryName,
    categorySlug,
    description: typeof source.description === 'string' ? source.description : null,
    sellingPrice: asNumber(source.sellingPrice, 0),
    mrp: typeof source.mrp === 'number' ? source.mrp : null,
    stockQuantity: asNumber(source.stockQuantity, 0),
    imageUrl: typeof source.imageUrl === 'string' ? source.imageUrl : null,
    discountPercentage: typeof source.discountPercentage === 'number' ? source.discountPercentage : null,
    popularityScore: asNumber(source.popularityScore, 0),
    isFeatured: Boolean(source.isFeatured),
    isMedicine: Boolean(source.isMedicine),
    medicineId: typeof source.medicineId === 'string' ? source.medicineId : null,
    href,
    sizeLabel: typeof source.sizeLabel === 'string' ? source.sizeLabel : null,
    packSize: typeof source.packSize === 'string' ? source.packSize : null,
  }
}

async function fetchEngineResults(query: string, limit: number, isPrefix: boolean): Promise<SearchResult[] | null> {
  const { endpoint, index, apiKey, timeoutMs, type } = getEngineConfig()

  if (!endpoint) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS)

  try {
    if (type === 'meilisearch') {
      const res = await fetch(`${endpoint}/indexes/${index}/search`, {
        method: 'POST',
        headers: buildHeaders(apiKey, type),
        body: JSON.stringify({
          q: query,
          limit: Math.max(1, Math.min(limit, 40)),
          sort: ['popularityScore:desc'],
          attributesToRetrieve: ['*'],
          showRankingScore: true,
        }),
        signal: controller.signal,
      })

      if (!res.ok) return null

      const payload = (await res.json()) as MeiliResponse
      const hits = payload.hits || []
      const results: SearchResult[] = []
      for (const hit of hits) {
        const item = mapEngineHitToSearchable(hit)
        if (!item) continue
        const rankingScore = typeof hit._rankingScore === 'number' ? hit._rankingScore : 0.5
        results.push({
          item,
          score: rankingScore,
          combinedScore: rankingScore + (item.popularityScore || 0) / 100000,
        })
      }
      return results
    }

    const fields = ['name^4', 'slug^3', 'brandName^2', 'categoryName^2', 'description', 'genericName', 'manufacturer']
    const body = {
      size: Math.max(1, Math.min(limit, 40)),
      query: {
        multi_match: {
          query,
          fields,
          type: isPrefix ? 'bool_prefix' : 'best_fields',
        },
      },
      sort: [{ _score: 'desc' }, { popularityScore: { order: 'desc', unmapped_type: 'long' } }],
    }

    const res = await fetch(`${endpoint}/${index}/_search`, {
      method: 'POST',
      headers: buildHeaders(apiKey, type),
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      return null
    }

    const payload = (await res.json()) as EngineResponse
    const hits = payload.hits?.hits || []
    if (!hits.length) return []

    const results: SearchResult[] = []
    for (const h of hits) {
      if (!h._source) continue
      const item = mapEngineHitToSearchable(h._source)
      if (!item) continue
      const score = typeof h._score === 'number' ? h._score : 0.5
      results.push({
        item,
        score,
        combinedScore: score + (item.popularityScore || 0) / 100000,
      })
    }
    return results
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Phase 3 provider: route search traffic to external engine when configured,
 * with transparent fallback to DB provider.
 */
export const engineSearchProvider: SearchProvider = {
  async getTopProducts(limit) {
    // Top products remain DB-driven for now.
    return dbSearchProvider.getTopProducts(limit)
  },

  async searchProducts(query, limit) {
    const engineResults = await fetchEngineResults(query, limit, false)
    if (engineResults !== null) return engineResults
    return dbSearchProvider.searchProducts(query, limit)
  },

  async searchProductsByPrefix(query, limit) {
    const engineResults = await fetchEngineResults(query, limit, true)
    if (engineResults !== null) return engineResults
    return dbSearchProvider.searchProductsByPrefix(query, limit)
  },
}

