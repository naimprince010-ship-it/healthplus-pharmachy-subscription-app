import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs'
import path from 'path'
import {
  buildAutoSourceCategoryIdMap,
  isAzanAutoCreateSourceCategoriesEnabled,
} from '@/lib/integrations/azan-source-categories'
import { parseAzanWholesaleProductNumericId } from '@/lib/integrations/azan-catalog'

type AnyRecord = Record<string, unknown>

interface AzanProduct {
  name: string
  supplierPrice: number
  mrpPrice: number
  stock: number
  sku: string | null
  imageUrl: string | null
  sourceCategoryKey: string | null
  sourceCategoryLabel: string | null
  supplierProductId: number | null
}

let prisma: PrismaClient | null = null
let pgPool: Pool | null = null

function buildPoolConnectionString(url: string) {
  return url
    .replace(/[?&]pgbouncer=[^&]*/g, '')
    .replace(/[?&]connection_limit=[^&]*/g, '')
    .replace(/[?&]sslmode=[^&]*/g, '')
}

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    loadLocalEnv()
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set in .env / .env.local')
    }
    pgPool = new Pool({
      connectionString: buildPoolConnectionString(process.env.DATABASE_URL),
      ssl: { rejectUnauthorized: false },
    })
    prisma = new PrismaClient({ adapter: new PrismaPg(pgPool) })
  }
  return prisma
}

function loadLocalEnv() {
  const root = process.cwd()
  const envFiles = ['.env', '.env.local']

  for (const file of envFiles) {
    const fullPath = path.join(root, file)
    if (!fs.existsSync(fullPath)) continue

    const lines = fs.readFileSync(fullPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const equalIndex = trimmed.indexOf('=')
      if (equalIndex === -1) continue

      const key = trimmed.slice(0, equalIndex).trim()
      let value = trimmed.slice(equalIndex + 1).trim()

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      // Prefer file when parent shell left an empty var (skips .env).
      const existing = process.env[key]
      const isEmpty = existing === undefined || String(existing).trim() === ''
      if (!(key in process.env) || isEmpty) {
        process.env[key] = value
      }
    }
  }
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const cleaned = value.replace(/[^\d.]/g, '')
  if (!cleaned) return null

  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value)
  if (typeof value !== 'string') return null

  const cleaned = value.replace(/[^\d-]/g, '')
  if (!cleaned) return null

  const parsed = Number.parseInt(cleaned, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function getStringValue(obj: AnyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const val = obj[key]
    if (typeof val === 'string' && val.trim()) return val.trim()
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
  if (direct) return { key: normalizeSourceCategoryKey(direct), label: direct }

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
    if (typeof first === 'string') return { key: normalizeSourceCategoryKey(first), label: first }
    if (first && typeof first === 'object') {
      const obj = first as AnyRecord
      const label = getStringValue(obj, ['name', 'title', 'category_name'])
      const key = getStringValue(obj, ['slug', 'key', 'code']) || label
      return { key: normalizeSourceCategoryKey(key), label }
    }
  }
  return { key: null, label: null }
}

function extractArray(payload: AnyRecord): unknown[] {
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    const layer = payload.data as AnyRecord
    if (Array.isArray(layer.data)) return layer.data
    if (Array.isArray(layer.products)) return layer.products
  }

  const candidates = [payload.data, payload.products, payload.items, payload.results]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as AnyRecord
      if (Array.isArray(nested.data)) return nested.data
      if (Array.isArray(nested.products)) return nested.products
      if (Array.isArray(nested.items)) return nested.items
    }
  }

  return []
}

function getEndpointCandidates(baseUrl: string, productsPath: string): string[] {
  const pathCandidates = [
    productsPath,
    '/api/en/products/by-api?per_page=300&selected_product=0',
    '/api/v1/products',
    '/api/v1/get-products',
    '/api/v1/get_products',
    '/api/v1/fetch-products',
    '/api/v1/fetch_products',
    '/api/products',
    '/api/v1/product',
    '/api/product',
    '/api/v1/get-product',
    '/api/v1/get_product',
    '/api/get-products',
    '/api/get_products',
    '/api/get-product',
    '/api/get_product',
  ]

  const unique = new Set<string>()
  for (const candidatePath of pathCandidates) {
    const url = new URL(candidatePath, baseUrl)
    unique.add(url.toString())
  }

  return Array.from(unique)
}

function applyExtraQuery(url: URL, extraQuery: string) {
  if (!extraQuery.trim()) return

  const query = new URLSearchParams(extraQuery)
  for (const [key, value] of query.entries()) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value)
    }
  }
}

function setPageParam(url: URL, page: number) {
  if (url.searchParams.has('page')) {
    url.searchParams.set('page', page.toString())
    return
  }

  // Some APIs use p instead of page
  if (url.searchParams.has('p')) {
    url.searchParams.set('p', page.toString())
    return
  }

  url.searchParams.set('page', page.toString())
}

/** Only well-formed names — duplicate/unusual header keys can make undici `fetch` throw. */
function buildAuthHeaders(appId: string, secretKey: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'App-Id': appId,
    'Secret-Key': secretKey,
  }
}

function applyAuthQuery(url: URL, appId: string, secretKey: string) {
  const possiblePairs: Array<[string, string]> = [
    ['app_id', appId],
    ['secret_key', secretKey],
    ['appId', appId],
    ['secretKey', secretKey],
  ]

  for (const [key, value] of possiblePairs) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value)
    }
  }
}

async function resolveWorkingEndpoint(
  appId: string,
  secretKey: string,
  baseUrls: string[],
  preferredPath: string,
  extraQuery: string,
): Promise<string> {
  for (const baseUrl of baseUrls) {
    const candidates = getEndpointCandidates(baseUrl, preferredPath)
    for (const endpoint of candidates) {
      const url = new URL(endpoint)
      applyExtraQuery(url, extraQuery)
      applyAuthQuery(url, appId, secretKey)
      setPageParam(url, 1)

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: buildAuthHeaders(appId, secretKey),
        })

        if (!response.ok) continue
        const payload = (await response.json()) as AnyRecord
        const list = extractArray(payload)
        if (list.length === 0) continue

        const validWithPrice = list.map(normalizeProduct).filter((item): item is AzanProduct => item !== null)
        if (validWithPrice.length > 0) {
          return endpoint
        }
      } catch {
        // Try next candidate endpoint
      }
    }
  }

  // Do not return a "fallback" with list but no normalizable products (e.g. /api/v1/products without prices).
  throw new Error(
    'No Azan endpoint returned products with a usable supplier price. Check AZAN_WHOLESALE_BASE_URL (use https://staging.azanwholesale.com for sandbox) and GET /api/en/products/by-api?per_page=...&selected_product=0 in the docs.',
  )
}

function normalizeProduct(raw: unknown): AzanProduct | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as AnyRecord

  const name = getStringValue(item, ['product_name', 'name', 'title'])
  if (!name) return null

  const supplierPrice =
    parseNumber(item.wholesale_price) ??
    parseNumber(item.supplier_price) ??
    parseNumber(item.unit_price) ??
    parseNumber(item.purchase_price) ??
    parseNumber(item.cost_price) ??
    parseNumber(item.wholesale_price) ??
    parseNumber(item.supplier_price_bdt) ??
    parseNumber(item.dealer_price) ??
    parseNumber(item.reseller_price) ??
    parseNumber(item.regular_price) ??
    parseNumber(item.sale_price) ??
    parseNumber(item.shopify_price) ??
    parseNumber(item.price_bdt) ??
    parseNumber(item.product_price) ??
    parseNumber(item.price)

  const allowMissingPrice = process.env.AZAN_WHOLESALE_ALLOW_MISSING_PRICE === 'true'
  const defaultSupplierPrice = Number.parseFloat(process.env.AZAN_WHOLESALE_DEFAULT_SUPPLIER_PRICE || '0')

  let finalSupplierPrice = supplierPrice
  if (!finalSupplierPrice || finalSupplierPrice <= 0) {
    if (!allowMissingPrice) return null
    finalSupplierPrice = Number.isFinite(defaultSupplierPrice) && defaultSupplierPrice >= 0 ? defaultSupplierPrice : 0
  }

  const mrpPrice = parseNumber(item.mrp_price) ?? parseNumber(item.mrp) ?? null
  if (!mrpPrice || mrpPrice <= 0) return null

  const stock =
    parseInteger(item.stock) ??
    parseInteger(item.stock_quantity) ??
    parseInteger(item.quantity) ??
    parseInteger(item.available_qty) ??
    parseInteger(item.qty) ??
    parseInteger(item.current_quantity) ??
    parseInteger(item.current_stock) ??
    parseInteger(item.available_stock) ??
    parseInteger(item.available_quantity) ??
    0

  const sku =
    getStringValue(item, ['sku', 'supplier_product_id', 'product_code', 'code', 'product_id']) ??
    (typeof item.id === 'string' || typeof item.id === 'number' ? String(item.id) : null)
  const sourceCategory = extractSourceCategory(item)

  let firstPicture: string | null = null
  if (Array.isArray(item.pictures) && item.pictures[0]) {
    const p0 = item.pictures[0]
    if (typeof p0 === 'string' && p0.trim()) firstPicture = p0.trim()
    else if (typeof p0 === 'object' && p0 !== null) {
      firstPicture = getStringValue(p0 as AnyRecord, ['image', 'url', 'path', 'src', 'link'])
    }
  }
  const imageUrl =
    getStringValue(item, ['product_image', 'image', 'image_url', 'thumbnail', 'meta_image']) ?? firstPicture
  const imageBase = (process.env.AZAN_WHOLESALE_BASE_URL || 'https://api.azanwholesale.com').replace(/\/$/, '')
  const normalizedImage =
    imageUrl && !imageUrl.startsWith('http') ? `${imageBase}/${imageUrl.replace(/^\/+/, '')}` : imageUrl

  return {
    name,
    supplierPrice: finalSupplierPrice,
    stock: stock > 0 ? stock : 0,
    sku,
    imageUrl: normalizedImage ?? null,
    sourceCategoryKey: sourceCategory.key,
    sourceCategoryLabel: sourceCategory.label,
    supplierProductId: parseAzanWholesaleProductNumericId(item as AnyRecord),
    mrpPrice,
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseAzanApiMeta(raw: unknown): { total: number; last_page: number; per_page: number; current_page: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as AnyRecord
  const total = typeof m.total === 'number' ? m.total : null
  const last_page = typeof m.last_page === 'number' ? m.last_page : null
  const per_page = typeof m.per_page === 'number' ? m.per_page : null
  const current_page = typeof m.current_page === 'number' ? m.current_page : null
  if (total == null || last_page == null || per_page == null || current_page == null) return null
  return { total, last_page, per_page, current_page }
}

async function fetchAzanProducts(): Promise<AzanProduct[]> {
  loadLocalEnv()

  const appId = process.env.AZAN_WHOLESALE_APP_ID
  const secretKey = process.env.AZAN_WHOLESALE_SECRET_KEY
  const baseUrl = process.env.AZAN_WHOLESALE_BASE_URL || 'https://azanwholesale.com'
  const fallbackBaseUrls = (process.env.AZAN_WHOLESALE_FALLBACK_BASE_URLS || 'https://extent.azanwholesale.com')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const productsPath = process.env.AZAN_WHOLESALE_PRODUCTS_PATH || '/api/en/products/by-api?per_page=300&selected_product=0'
  const extraQuery = process.env.AZAN_WHOLESALE_EXTRA_QUERY || ''
  const maxPages = Number.parseInt(process.env.AZAN_WHOLESALE_MAX_PAGES || '300', 10)

  if (!appId || !secretKey) {
    throw new Error('Missing AZAN_WHOLESALE_APP_ID or AZAN_WHOLESALE_SECRET_KEY in environment.')
  }

  const results: AzanProduct[] = []
  const seenKeys = new Set<string>()
  const endpoint = await resolveWorkingEndpoint(appId, secretKey, [baseUrl, ...fallbackBaseUrls], productsPath, extraQuery)

  console.log(`Using Azan endpoint: ${endpoint}`)

  let effectiveMaxPages = maxPages
  for (let page = 1; page <= effectiveMaxPages; page++) {
    const url = new URL(endpoint)
    applyExtraQuery(url, extraQuery)
    applyAuthQuery(url, appId, secretKey)
    setPageParam(url, page)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: buildAuthHeaders(appId, secretKey),
    })

    if (!response.ok) {
      console.warn(`Azan API failed at page ${page}: ${response.status} ${response.statusText}. Stopping pagination and saving what we have.`)
      break
    }

    const payload = (await response.json()) as AnyRecord
    if (page === 1) {
      const m = parseAzanApiMeta(payload.meta)
      if (m && m.last_page > 0) {
        effectiveMaxPages = Math.min(maxPages, m.last_page)
      }
    }
    const list = extractArray(payload)
    if (list.length === 0) break

    let pageAdded = 0
    for (const raw of list) {
      const product = normalizeProduct(raw)
      if (!product) continue

      const key = product.sku || slugify(product.name)
      if (seenKeys.has(key)) continue

      seenKeys.add(key)
      results.push(product)
      pageAdded++
    }

    if (pageAdded === 0) break
  }

  return results
}

interface AzanProduct {
  name: string
  supplierPrice: number
  stock: number
  sku: string | null
  imageUrl: string | null
  sourceCategoryKey: string | null
  sourceCategoryLabel: string | null
  supplierProductId: number | null
  mrpPrice: number
}

async function upsertAzanProducts(products: AzanProduct[]) {
  const prismaClient = getPrismaClient()
  const categoryName = process.env.AZAN_WHOLESALE_CATEGORY || 'Azan Wholesale'
  const categorySlug = slugify(categoryName) || 'azan-wholesale'

  let category = await prismaClient.category.findUnique({ where: { name: categoryName } })
  if (!category) {
    category = await prismaClient.category.create({
      data: {
        name: categoryName,
        slug: categorySlug,
        isActive: true,
        isMedicineCategory: false,
      },
    })
  }

  let success = 0
  let failed = 0
  const mappings = await prismaClient.azanCategoryMapping.findMany({
    where: { isActive: true },
    select: { sourceCategoryKey: true, localCategoryId: true },
  })
  const mappingByKey = new Map(mappings.map((m) => [m.sourceCategoryKey.trim().toLowerCase(), m.localCategoryId]))

  const autoCreateEnabled = isAzanAutoCreateSourceCategoriesEnabled()
  let autoByKey = new Map<string, string>()
  let newSourceCategoriesCreated = 0
  if (autoCreateEnabled) {
    const { bySourceKey, newCategoriesCreated } = await buildAutoSourceCategoryIdMap(
      prismaClient,
      products,
      mappingByKey
    )
    autoByKey = bySourceKey
    newSourceCategoriesCreated = newCategoriesCreated
  }

  for (const item of products) {
    const slug = item.sku ? `${slugify(item.name)}-${slugify(item.sku)}` : slugify(item.name)
    const sellingPrice = item.mrpPrice
    const mrp = item.mrpPrice

    const k = item.sourceCategoryKey?.trim().toLowerCase() ?? null
    let resolvedCategoryId = category.id
    if (k) {
      const explicit = mappingByKey.get(k)
      if (explicit) {
        resolvedCategoryId = explicit
      } else if (autoCreateEnabled && autoByKey.has(k)) {
        resolvedCategoryId = autoByKey.get(k)!
      }
    }
    const hasStock = item.stock > 0
    try {
      await prismaClient.product.upsert({
        where: { slug },
        update: {
          name: item.name,
          purchasePrice: item.supplierPrice,
          sellingPrice,
          mrp,
          stockQuantity: item.stock,
          inStock: hasStock,
          isActive: hasStock,
          imageUrl: item.imageUrl,
          supplierSku: item.sku,
          sourceCategoryName: item.sourceCategoryLabel || item.sourceCategoryKey,
          categoryId: resolvedCategoryId,
          deletedAt: null,
          supplierProductId: item.supplierProductId,
        },
        create: {
          type: 'GENERAL',
          name: item.name,
          slug,
          sellingPrice,
          purchasePrice: item.supplierPrice,
          mrp,
          imageUrl: item.imageUrl,
          stockQuantity: item.stock,
          isActive: hasStock,
          categoryId: resolvedCategoryId,
          unit: 'pcs',
          inStock: hasStock,
          supplierSku: item.sku,
          sourceCategoryName: item.sourceCategoryLabel || item.sourceCategoryKey,
          supplierProductId: item.supplierProductId,
        },
      })
      success++
    } catch {
      failed++
    }
  }

  return { success, failed, newSourceCategoriesCreated, autoCreateEnabled }
}

async function main() {
  loadLocalEnv()
  const products = await fetchAzanProducts()
  if (products.length === 0) {
    console.log('No products returned from Azan API.')
    return
  }

  const outputDir = path.join(process.cwd(), 'playwright-temp')
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'azan_products.json'), JSON.stringify(products, null, 2), 'utf8')

  const fetchOnly = process.env.AZAN_WHOLESALE_FETCH_ONLY === 'true'
  if (fetchOnly || !process.env.DATABASE_URL) {
    console.log(`Azan fetch complete. Saved ${products.length} products to playwright-temp/azan_products.json`)
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL is not set, so DB import was skipped.')
    }
    return
  }

  const { success, failed, newSourceCategoriesCreated, autoCreateEnabled } = await upsertAzanProducts(products)

  console.log(
    `Azan sync complete. Fetched: ${products.length}, Imported/Updated: ${success}, Failed: ${failed}` +
      (autoCreateEnabled ? `, New local categories: ${newSourceCategoriesCreated}` : '')
  )
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Azan sync failed: ${message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
    if (pgPool) {
      await pgPool.end()
    }
  })
