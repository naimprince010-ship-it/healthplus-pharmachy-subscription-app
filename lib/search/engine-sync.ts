import { prisma } from '@/lib/prisma'
import type { SearchableProduct } from '@/lib/search-index'

type ProductRow = {
  id: string
  type: string
  name: string
  slug: string
  brandName: string | null
  description: string | null
  sellingPrice: number
  mrp: number | null
  stockQuantity: number
  imageUrl: string | null
  discountPercentage: number | null
  popularityScore: number
  isFeatured: boolean
  sizeLabel: string | null
  category: { name: string; slug: string }
  medicine: {
    id: string
    genericName: string | null
    manufacturer: string | null
    brandName: string | null
    discountPercentage: number | null
    packSize: string | null
  } | null
}

export type ReindexSummary = {
  indexed: number
  failed: number
  batches: number
}

function getEngineConfig() {
  const endpoint = (process.env.SEARCH_ENGINE_ENDPOINT || '').trim().replace(/\/+$/, '')
  const index = (process.env.SEARCH_ENGINE_INDEX || 'products').trim()
  const apiKey = (process.env.SEARCH_ENGINE_API_KEY || '').trim()
  const timeoutMs = Number(process.env.SEARCH_ENGINE_TIMEOUT_MS || 5000)
  const type = (process.env.SEARCH_ENGINE_TYPE || 'opensearch').trim().toLowerCase()
  const enabled = Boolean(endpoint && process.env.SEARCH_PROVIDER?.trim().toLowerCase() === 'engine')
  return { endpoint, index, apiKey, timeoutMs, type, enabled }
}

function buildHeaders(apiKey: string, type: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers.Authorization = type === 'meilisearch' ? `Bearer ${apiKey}` : `ApiKey ${apiKey}`
  return headers
}

function mapToSearchDoc(p: ProductRow): SearchableProduct {
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
    discountPercentage: p.discountPercentage ?? p.medicine?.discountPercentage ?? null,
    popularityScore: p.popularityScore ?? 0,
    isFeatured: p.isFeatured,
    isMedicine: p.type === 'MEDICINE',
    medicineId: p.medicine?.id || null,
    href: `/products/${p.slug}`,
    sizeLabel: p.sizeLabel || null,
    packSize: p.medicine?.packSize ?? null,
  }
}

async function engineFetch(path: string, init: RequestInit): Promise<Response> {
  const { endpoint, timeoutMs } = getEngineConfig()
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 5000)
  try {
    return await fetch(`${endpoint}${path}`, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(t)
  }
}

export function isSearchEngineSyncEnabled(): boolean {
  return getEngineConfig().enabled
}

export async function upsertSearchDocument(doc: SearchableProduct): Promise<boolean> {
  const { enabled, index, apiKey, type } = getEngineConfig()
  if (!enabled) return false

  if (type === 'meilisearch') {
    const res = await engineFetch(`/indexes/${index}/documents`, {
      method: 'POST',
      headers: buildHeaders(apiKey, type),
      body: JSON.stringify([doc]),
    })
    return res.ok
  }

  const res = await engineFetch(`/${index}/_doc/${doc.id}`, {
    method: 'PUT',
    headers: buildHeaders(apiKey, type),
    body: JSON.stringify(doc),
  })
  return res.ok
}

export async function deleteSearchDocument(docId: string): Promise<boolean> {
  const { enabled, index, apiKey, type } = getEngineConfig()
  if (!enabled) return false

  if (type === 'meilisearch') {
    const res = await engineFetch(`/indexes/${index}/documents/${docId}`, {
      method: 'DELETE',
      headers: buildHeaders(apiKey, type),
    })
    return res.ok || res.status === 404
  }

  const res = await engineFetch(`/${index}/_doc/${docId}`, {
    method: 'DELETE',
    headers: buildHeaders(apiKey, type),
  })
  return res.ok || res.status === 404
}

async function configureMeiliIndex(index: string, apiKey: string, type: string): Promise<boolean> {
  const headers = buildHeaders(apiKey, type)

  const createRes = await engineFetch('/indexes', {
    method: 'POST',
    headers,
    body: JSON.stringify({ uid: index, primaryKey: 'id' }),
  })
  if (!createRes.ok && createRes.status !== 409) return false

  const settingsRes = await engineFetch(`/indexes/${index}/settings`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      searchableAttributes: [
        'name',
        'brandName',
        'genericName',
        'manufacturer',
        'categoryName',
        'description',
        'slug',
        'sizeLabel',
        'packSize',
      ],
      displayedAttributes: ['*'],
      sortableAttributes: ['popularityScore', 'sellingPrice', 'name'],
      filterableAttributes: ['type', 'categorySlug', 'isMedicine', 'isFeatured', 'stockQuantity'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    }),
  })

  return settingsRes.ok
}

export async function syncProductById(productId: string): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true, medicine: true },
  })
  if (!product || !product.isActive || product.deletedAt) {
    return deleteSearchDocument(productId)
  }
  return upsertSearchDocument(mapToSearchDoc(product as unknown as ProductRow))
}

export async function reindexAllProductsToSearchEngine(opts?: {
  batchSize?: number
  maxBatches?: number
}): Promise<ReindexSummary> {
  const { enabled, index, apiKey, type } = getEngineConfig()
  if (!enabled) return { indexed: 0, failed: 0, batches: 0 }

  const batchSize = Math.max(50, Math.min(opts?.batchSize || 500, 2000))
  const maxBatches = Math.max(1, opts?.maxBatches || 2000)

  let cursor: string | null = null
  let batches = 0
  let indexed = 0
  let failed = 0

  if (type === 'meilisearch') {
    const configured = await configureMeiliIndex(index, apiKey, type)
    if (!configured) return { indexed: 0, failed: 0, batches: 0 }
  }

  while (batches < maxBatches) {
    const rows: ProductRow[] = (await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: { category: true, medicine: true },
      orderBy: { id: 'asc' },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })) as unknown as ProductRow[]

    if (!rows.length) break

    const docs = rows.map((row) => mapToSearchDoc(row as unknown as ProductRow))

    if (type === 'meilisearch') {
      const res = await engineFetch(`/indexes/${index}/documents`, {
        method: 'POST',
        headers: buildHeaders(apiKey, type),
        body: JSON.stringify(docs),
      })
      if (res.ok) indexed += rows.length
      else failed += rows.length
    } else {
      const lines: string[] = []
      for (const doc of docs) {
        lines.push(JSON.stringify({ index: { _index: index, _id: doc.id } }))
        lines.push(JSON.stringify(doc))
      }

      const bulkBody = `${lines.join('\n')}\n`
      const res = await engineFetch('/_bulk', {
        method: 'POST',
        headers: buildHeaders(apiKey, type),
        body: bulkBody,
      })

      if (!res.ok) {
        failed += rows.length
      } else {
        const payload = (await res.json()) as { items?: Array<{ index?: { status?: number; error?: unknown } }> }
        const items = payload.items || []
        if (!items.length) {
          indexed += rows.length
        } else {
          for (const item of items) {
            const status = item.index?.status || 500
            if (status >= 200 && status < 300) indexed += 1
            else failed += 1
          }
        }
      }
    }

    batches += 1
    cursor = rows[rows.length - 1].id
  }

  return { indexed, failed, batches }
}

