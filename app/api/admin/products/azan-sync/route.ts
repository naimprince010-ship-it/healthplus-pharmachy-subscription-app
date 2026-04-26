import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseAzanWholesaleProductNumericId, prismaWhereAzanCatalogProducts } from '@/lib/integrations/azan-catalog'
import {
  buildAutoSourceCategoryIdMap,
  isAzanAutoCreateSourceCategoriesEnabled,
} from '@/lib/integrations/azan-source-categories'
import { slugify } from '@/lib/slugify'
import { invalidateSearchIndex } from '@/lib/search-index'
import { getAzanOrderForwardEnvSummary } from '@/lib/integrations/azan-wholesale'
import { getAzanRetailMultiplierFromEnv } from '@/lib/azan-pricing'

type AnyRecord = Record<string, unknown>

interface AzanNormalizedProduct {
  name: string
  sku: string | null
  imageUrl: string | null
  purchasePrice: number | null
  stockQuantity: number
  brandName: string | null
  sourceCategoryKey: string | null
  sourceCategoryLabel: string | null
  /** Azan API product id (supplier_product_id in order store) */
  supplierProductId: number | null
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function parseIntValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value)
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^\d-]/g, '')
  if (!cleaned) return null
  const parsed = Number.parseInt(cleaned, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function getStringValue(obj: AnyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function normalizeSourceCategoryKey(value: string | null): string | null {
  if (!value) return null
  const cleaned = value.trim().toLowerCase()
  return cleaned || null
}

function extractSourceCategory(item: AnyRecord): { key: string | null; label: string | null } {
  const direct = getStringValue(item, ['category', 'category_name', 'product_category', 'product_category_name'])
  if (direct) {
    return { key: normalizeSourceCategoryKey(direct), label: direct }
  }

  const categories = item.product_categories
  if (typeof categories === 'string' && categories.trim()) {
    const parts = categories
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    const label = parts[1] || parts[0] || categories.trim()
    return { key: normalizeSourceCategoryKey(label), label }
  }
  if (Array.isArray(categories) && categories.length > 0) {
    const first = categories[0]
    if (typeof first === 'string') {
      return { key: normalizeSourceCategoryKey(first), label: first }
    }
    if (first && typeof first === 'object') {
      const firstObj = first as AnyRecord
      const label = getStringValue(firstObj, ['name', 'title', 'category_name'])
      const key = getStringValue(firstObj, ['slug', 'key', 'code']) || label
      return { key: normalizeSourceCategoryKey(key), label }
    }
  }

  return { key: null, label: null }
}

function extractList(payload: AnyRecord): AnyRecord[] {
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    const layer = payload.data as AnyRecord
    if (Array.isArray(layer.data)) return layer.data as AnyRecord[]
    if (Array.isArray(layer.products)) return layer.products as AnyRecord[]
  }
  const candidates = [payload.data, payload.products, payload.items, payload.results]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as AnyRecord[]
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as AnyRecord
      if (Array.isArray(nested.data)) return nested.data as AnyRecord[]
      if (Array.isArray(nested.products)) return nested.products as AnyRecord[]
      if (Array.isArray(nested.items)) return nested.items as AnyRecord[]
    }
  }
  return []
}

function normalizeImage(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  const base = (process.env.AZAN_WHOLESALE_BASE_URL || 'https://api.azanwholesale.com').replace(/\/$/, '')
  return `${base}/${imageUrl.replace(/^\/+/, '')}`
}

function normalizeProduct(item: AnyRecord): AzanNormalizedProduct | null {
  const name = getStringValue(item, ['name', 'product_name', 'title'])
  if (!name) return null

  const purchasePrice =
    parseNumber(item.wholesale_price) ??
    parseNumber(item.supplier_price) ??
    parseNumber(item.unit_price) ??
    parseNumber(item.price) ??
    parseNumber(item.product_price)

  if (purchasePrice == null || purchasePrice <= 0) return null

  let firstPicture: string | null = null
  if (Array.isArray(item.pictures) && item.pictures[0]) {
    const p0 = item.pictures[0]
    if (typeof p0 === 'string' && p0.trim()) firstPicture = p0.trim()
    else if (typeof p0 === 'object' && p0 !== null) {
      firstPicture = getStringValue(p0 as AnyRecord, ['image', 'url', 'path', 'src', 'link'])
    }
  }
  const rawImage =
    getStringValue(item, ['product_image', 'image', 'image_url', 'thumbnail', 'meta_image']) ?? firstPicture

  const stockQuantity =
    parseIntValue(item.stock) ??
    parseIntValue(item.stock_quantity) ??
    parseIntValue(item.quantity) ??
    parseIntValue(item.qty) ??
    parseIntValue(item.available_qty) ??
    0

  const sku =
    getStringValue(item, ['sku', 'supplier_product_id', 'product_code']) ??
    (typeof item.id === 'number' || typeof item.id === 'string' ? String(item.id) : null)
  const sourceCategory = extractSourceCategory(item)

  return {
    name,
    sku,
    imageUrl: normalizeImage(rawImage),
    purchasePrice,
    stockQuantity: stockQuantity > 0 ? stockQuantity : 0,
    brandName: getStringValue(item, ['brand_name', 'brand']),
    sourceCategoryKey: sourceCategory.key,
    sourceCategoryLabel: sourceCategory.label,
    supplierProductId: parseAzanWholesaleProductNumericId(item as Record<string, unknown>),
  }
}

function parseAzanMeta(raw: unknown): { total: number; last_page: number; per_page: number; current_page: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as AnyRecord
  const total = typeof m.total === 'number' ? m.total : null
  const last_page = typeof m.last_page === 'number' ? m.last_page : null
  const per_page = typeof m.per_page === 'number' ? m.per_page : null
  const current_page = typeof m.current_page === 'number' ? m.current_page : null
  if (total == null || last_page == null || per_page == null || current_page == null) return null
  return { total, last_page, per_page, current_page }
}

/** One GET to page 1; reads Laravel-style meta (total, last_page). */
async function fetchAzanCatalogMeta(): Promise<{ endpoint: string; fullUrl: string; meta: ReturnType<typeof parseAzanMeta> }> {
  const appId = process.env.AZAN_WHOLESALE_APP_ID
  const secretKey = process.env.AZAN_WHOLESALE_SECRET_KEY
  if (!appId || !secretKey) {
    throw new Error('Missing AZAN_WHOLESALE_APP_ID or AZAN_WHOLESALE_SECRET_KEY')
  }

  const baseUrl = process.env.AZAN_WHOLESALE_BASE_URL || 'https://api.azanwholesale.com'
  const envPath = process.env.AZAN_WHOLESALE_PRODUCTS_PATH?.trim()
  const endpoints = [
    envPath && envPath.length > 0 ? envPath : '/api/en/products/by-api?per_page=300&selected_product=0',
    '/api/en/products/by-api?per_page=300&selected_product=0',
    '/api/v1/products',
  ]

  for (const endpoint of endpoints) {
    const testUrl = new URL(endpoint, baseUrl)
    testUrl.searchParams.set('page', '1')
    for (const [k, v] of [
      ['app_id', appId],
      ['secret_key', secretKey],
    ] as const) {
      if (!testUrl.searchParams.has(k)) testUrl.searchParams.set(k, v)
    }
    const testResponse = await fetch(testUrl.toString(), {
      headers: {
        Accept: 'application/json',
        'App-Id': appId,
        'Secret-Key': secretKey,
      },
    })
    if (!testResponse.ok) continue
    const testPayload = (await testResponse.json()) as AnyRecord
    const testList = extractList(testPayload)
    if (testList.length === 0) continue
    const hasPricedProduct = testList.some((row) => normalizeProduct(row) != null)
    if (!hasPricedProduct) continue
    const meta = parseAzanMeta(testPayload.meta)
    return { endpoint, fullUrl: testUrl.toString(), meta }
  }

  throw new Error('No working Azan products endpoint found for meta')
}

async function fetchAzanProducts() {
  const appId = process.env.AZAN_WHOLESALE_APP_ID
  const secretKey = process.env.AZAN_WHOLESALE_SECRET_KEY
  if (!appId || !secretKey) {
    throw new Error('Missing AZAN_WHOLESALE_APP_ID or AZAN_WHOLESALE_SECRET_KEY')
  }

  const baseUrl = process.env.AZAN_WHOLESALE_BASE_URL || 'https://api.azanwholesale.com'
  const envPath = process.env.AZAN_WHOLESALE_PRODUCTS_PATH?.trim()
  const endpoints = [
    envPath && envPath.length > 0 ? envPath : '/api/en/products/by-api?per_page=300&selected_product=0',
    '/api/en/products/by-api?per_page=300&selected_product=0',
    '/api/v1/products',
  ]

  const maxPages = Number.parseInt(process.env.AZAN_WHOLESALE_MAX_PAGES || '300', 10)
  const results: AzanNormalizedProduct[] = []
  const seen = new Set<string>()
  let activeEndpoint: string | null = null

  for (const endpoint of endpoints) {
    const testUrl = new URL(endpoint, baseUrl)
    testUrl.searchParams.set('page', '1')
    for (const [k, v] of [
      ['app_id', appId],
      ['secret_key', secretKey],
    ] as const) {
      if (!testUrl.searchParams.has(k)) testUrl.searchParams.set(k, v)
    }
    const testResponse = await fetch(testUrl.toString(), {
      headers: {
        Accept: 'application/json',
        'App-Id': appId,
        'Secret-Key': secretKey,
      },
    })
    if (!testResponse.ok) continue
    const testPayload = (await testResponse.json()) as AnyRecord
    const testList = extractList(testPayload)
    if (testList.length === 0) continue
    const hasPricedProduct = testList.some((row) => normalizeProduct(row) != null)
    if (hasPricedProduct) {
      activeEndpoint = endpoint
      break
    }
  }

  if (!activeEndpoint) {
    throw new Error('No working Azan products endpoint found')
  }

  let effectiveMaxPages = maxPages
  for (let page = 1; page <= effectiveMaxPages; page++) {
    const url = new URL(activeEndpoint, baseUrl)
    url.searchParams.set('page', String(page))
    for (const [k, v] of [
      ['app_id', appId],
      ['secret_key', secretKey],
    ] as const) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v)
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'App-Id': appId,
        'Secret-Key': secretKey,
      },
    })

    if (!response.ok) break
    const payload = (await response.json()) as AnyRecord
    if (page === 1) {
      const m = parseAzanMeta(payload.meta)
      if (m && m.last_page > 0) {
        effectiveMaxPages = Math.min(maxPages, m.last_page)
      }
    }
    const list = extractList(payload)
    if (list.length === 0) break

    let pageAdded = 0
    for (const item of list) {
      const normalized = normalizeProduct(item)
      if (!normalized) continue
      const key = normalized.sku || slugify(normalized.name)
      if (seen.has(key)) continue
      seen.add(key)
      results.push(normalized)
      pageAdded++
    }

    if (pageAdded === 0) break
  }

  return { endpoint: activeEndpoint, products: results }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const categoryName = process.env.AZAN_WHOLESALE_CATEGORY || 'Azan Wholesale'
    /** Same rule as `scripts/sync-azan-api.ts`: 60% markup on cost = ×1.6 unless `AZAN_WHOLESALE_MARKUP` set */
    const multiplier = getAzanRetailMultiplierFromEnv()

    let category = await prisma.category.findUnique({ where: { name: categoryName } })
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          slug: slugify(categoryName),
          isActive: true,
          isMedicineCategory: false,
        },
      })
    }

    const { endpoint, products } = await fetchAzanProducts()
    let created = 0
    let updated = 0
    let missingPrice = 0
    let mappedToLocalCategory = 0
    let assignedViaAutoCategory = 0
    let fallbackToDefaultCategory = 0
    const autoCreateEnabled = isAzanAutoCreateSourceCategoriesEnabled()

    const mappings = await prisma.azanCategoryMapping.findMany({
      where: { isActive: true },
      select: { sourceCategoryKey: true, localCategoryId: true },
    })
    const mappingByKey = new Map(mappings.map((m) => [m.sourceCategoryKey.trim().toLowerCase(), m.localCategoryId]))

    let autoByKey = new Map<string, string>()
    let newSourceCategoriesCreated = 0
    if (autoCreateEnabled) {
      const { bySourceKey, newCategoriesCreated } = await buildAutoSourceCategoryIdMap(
        prisma,
        products,
        mappingByKey
      )
      autoByKey = bySourceKey
      newSourceCategoriesCreated = newCategoriesCreated
    }

    for (const product of products) {
      const baseSlug = slugify(product.name)
      const slug = product.sku ? `${baseSlug}-${slugify(product.sku)}` : baseSlug
      const sellingPrice = product.purchasePrice ? Math.ceil(product.purchasePrice * multiplier) : 0
      const k = product.sourceCategoryKey?.trim().toLowerCase() ?? null
      let resolvedCategoryId = category.id
      if (k) {
        const explicit = mappingByKey.get(k)
        if (explicit) {
          resolvedCategoryId = explicit
          mappedToLocalCategory++
        } else if (autoCreateEnabled && autoByKey.has(k)) {
          resolvedCategoryId = autoByKey.get(k)!
          assignedViaAutoCategory++
        } else {
          fallbackToDefaultCategory++
        }
      } else {
        fallbackToDefaultCategory++
      }

      const existing = await prisma.product.findUnique({ where: { slug } })
      const hasStock = product.stockQuantity > 0
      const updatePayload = {
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        inStock: hasStock,
        categoryId: resolvedCategoryId,
        isActive: hasStock,
        deletedAt: null,
        supplierSku: product.sku,
        sourceCategoryName: product.sourceCategoryLabel || product.sourceCategoryKey,
        supplierProductId: product.supplierProductId,
        ...(product.purchasePrice ? { purchasePrice: product.purchasePrice, sellingPrice, mrp: sellingPrice } : {}),
      }

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: updatePayload,
        })
        updated++
      } else {
        await prisma.product.create({
          data: {
            type: 'GENERAL',
            slug,
            unit: 'pcs',
            ...updatePayload,
            sellingPrice,
          },
        })
        created++
      }

      if (!product.purchasePrice) missingPrice++
    }

    invalidateSearchIndex()

    return NextResponse.json({
      success: true,
      endpoint,
      summary: {
        retailMultiplier: multiplier,
        fetched: products.length,
        created,
        updated,
        missingPrice,
        mappedToLocalCategory,
        autoCreateSourceCategories: autoCreateEnabled,
        newSourceCategoriesCreated: autoCreateEnabled ? newSourceCategoriesCreated : 0,
        assignedViaAutoCategory: autoCreateEnabled ? assignedViaAutoCategory : 0,
        fallbackToDefaultCategory,
        /** @deprecated use fallbackToDefaultCategory */
        fallbackToAzanCategory: fallbackToDefaultCategory,
      },
      message: 'Azan products synced to draft catalog',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Azan sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const categoryName = process.env.AZAN_WHOLESALE_CATEGORY || 'Azan Wholesale'
    const whereBase = prismaWhereAzanCatalogProducts()

    const [total, published, draft, missingPrice] = await Promise.all([
      prisma.product.count({ where: whereBase }),
      prisma.product.count({
        where: { ...whereBase, isActive: true },
      }),
      prisma.product.count({
        where: { ...whereBase, isActive: false },
      }),
      prisma.product.count({
        where: {
          ...whereBase,
          OR: [{ purchasePrice: null }, { purchasePrice: { lte: 0 } }],
        },
      }),
    ])

    const wantCompare = request.nextUrl.searchParams.get('compare') === '1' || request.nextUrl.searchParams.get('compare') === 'true'

    let coverage: Record<string, unknown> | undefined
    if (wantCompare) {
      try {
        const { meta, endpoint, fullUrl } = await fetchAzanCatalogMeta()
        const maxPages = Number.parseInt(process.env.AZAN_WHOLESALE_MAX_PAGES || '300', 10)
        const perPage = meta?.per_page ?? 0
        const apiTotal = meta?.total ?? null
        const effectivePages =
          meta && meta.last_page > 0 ? Math.min(maxPages, meta.last_page) : maxPages
        const maxPerRun = perPage * effectivePages
        const gap = apiTotal != null ? apiTotal - total : null
        coverage = {
          apiTotal,
          apiLastPage: meta?.last_page ?? null,
          apiPerPage: meta?.per_page ?? null,
          dbTotalInCategory: total,
          gapToApiTotal: gap,
          /** max products one sync can pull (admin + server uses AZAN_WHOLESALE_MAX_PAGES) */
          maxProductsPerSyncRun: maxPerRun,
          syncMaxPagesEnv: maxPages,
          effectiveSyncPages: effectivePages,
          fullCatalogCoveredInOneRun: apiTotal != null && maxPerRun >= apiTotal,
          endpoint,
          firstPageUrl: fullUrl,
          note:
            apiTotal != null && maxPerRun < apiTotal
              ? `Only ~${maxPerRun} of ${apiTotal} can load per run. Increase AZAN_WHOLESALE_MAX_PAGES (e.g. ${Math.ceil(apiTotal / Math.max(perPage, 1))}) or re-run sync until DB total matches API.`
              : null,
        }
      } catch (e) {
        coverage = {
          error: e instanceof Error ? e.message : 'Could not read Azan API meta (compare).',
        }
      }
    }

    const of = getAzanOrderForwardEnvSummary()
    return NextResponse.json({
      success: true,
      summary: {
        categoryName,
        total,
        published,
        draft,
        missingPrice,
      },
      coverage,
      orderForward: {
        ...of,
        envVar: 'AZAN_WHOLESALE_FORWARD_ORDERS',
        hint: !of.forwardOrdersEnabled
          ? 'Customer orders are NOT sent to Azan until you set AZAN_WHOLESALE_FORWARD_ORDERS=true (or 1) on the production environment.'
          : !of.hasApiCredentials
            ? 'Set AZAN_WHOLESALE_APP_ID and AZAN_WHOLESALE_SECRET_KEY on production.'
            : of.usingDefaultBaseUrl
              ? 'If your App-Id/Secret are for Azan **sandbox/staging**, you must also set AZAN_WHOLESALE_BASE_URL to that API origin (e.g. https://staging.azanwholesale.com). The default is https://api.azanwholesale.com (live) and will reject sandbox keys.'
              : null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch Azan stats'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
