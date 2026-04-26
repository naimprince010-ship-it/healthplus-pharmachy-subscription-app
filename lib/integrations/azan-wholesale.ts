/**
 * Azan Wholesale API helpers (orders + stock).
 * Auth: App-Id + Secret-Key (same as product sync). Base URL from AZAN_WHOLESALE_BASE_URL.
 */

/** Resolves the Azan API origin (no trailing slash). Used for all Azan HTTP calls. */
export function getAzanWholesaleApiBaseUrl(): string {
  const u = process.env.AZAN_WHOLESALE_BASE_URL || 'https://api.azanwholesale.com'
  return u.replace(/\/$/, '')
}

function getBaseUrl(): string {
  return getAzanWholesaleApiBaseUrl()
}

function getAuthHeaders(): Record<string, string> {
  const appId = process.env.AZAN_WHOLESALE_APP_ID
  const secretKey = process.env.AZAN_WHOLESALE_SECRET_KEY
  if (!appId || !secretKey) {
    throw new Error('Missing AZAN_WHOLESALE_APP_ID or AZAN_WHOLESALE_SECRET_KEY')
  }
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'App-Id': appId,
    'Secret-Key': secretKey,
  }
}

/** Line item for POST /api/orders/store (Azan docs). */
export interface AzanOrderLine {
  name: string
  /** Reseller (Halalzi) product id — required by Azan */
  product_id: string
  sales_price: number
  discount?: number
  quantity: number
  supplier?: string
  mrp_price?: number
  unit_price: number
  total_price: number
  wholesale_price?: number
  reward_point_used?: number
  /** Azan Wholesale catalog id (from sync) — use with or instead of sku per Azan */
  supplier_product_id?: number
  sku?: string | number
}

export interface AzanOrderPayload {
  date: string
  order_details: AzanOrderLine[]
  platform_source: string
  /** Azan sample uses string user id */
  platform_user_id: string
  order_source?: string
  shipping_address: {
    name: string
    email?: string
    phone?: string
    address: string
  }
  platform_order_id: string
  grand_total?: number
}

export interface AzanStockPayload {
  sku: string
  supplier: string
  stock: string
  status: string
}

export interface AzanProductUpdatePayload {
  sku: string
  supplier: string
  stock: string
  status: string
}

async function postJson(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  let data: unknown
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

async function getJson(path: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  let data: unknown
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

/** POST /api/orders/store — call after your customer order is confirmed (wire from checkout). */
export async function submitAzanResellerOrder(payload: AzanOrderPayload) {
  return postJson('/api/orders/store', payload)
}

/**
 * Best-effort text from a failed order-store response (message / error / Laravel-style errors).
 * Used to detect idempotent cases like "Order already exists".
 */
export function getAzanOrderStoreErrorText(data: unknown): string {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return ''
  const bag = data as Record<string, unknown>
  const chunks: string[] = []
  for (const key of ['message', 'error']) {
    const v = bag[key]
    if (typeof v === 'string') chunks.push(v)
  }
  const errors = bag.errors
  if (errors && typeof errors === 'object') {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(v)) chunks.push(v.map(String).join(' '))
      else if (v != null) chunks.push(String(v))
    }
  }
  for (const [k, v] of Object.entries(bag)) {
    if (/^\d+$/.test(k) && typeof v === 'string' && v.trim()) {
      chunks.push(`[${k}] ${v.trim()}`)
    }
  }
  return chunks.join(' ').trim()
}

/** Azan may reject duplicate platform_order_id with a 4xx and "Order already exists" — treat as already forwarded. */
export function isAzanOrderAlreadyExistsResponse(data: unknown): boolean {
  const t = getAzanOrderStoreErrorText(data).toLowerCase()
  if (!t) return false
  return t.includes('already exists') && (t.includes('order') || t.includes('duplicate'))
}

/**
 * One string for admin/DB: top-level message + optional full JSON (Azan often puts details outside `message`,
 * e.g. per-SKU errors for "All products failed.").
 */
export function formatAzanOrderStoreFailureForAdmin(data: unknown, httpStatus: number): string {
  const summary = getAzanOrderStoreErrorText(data)
  if (typeof data === 'string' && data.trim() && !summary) {
    return data.length > 2000 ? `${data.slice(0, 2000)}…` : data
  }
  if (data == null) {
    return `HTTP ${httpStatus}`
  }
  const full = (() => {
    try {
      return JSON.stringify(data)
    } catch {
      return String(data)
    }
  })()
  if (!summary) {
    return full.length > 3500 ? `${full.slice(0, 3500)}…\n(HTTP ${httpStatus})` : `${full}\n(HTTP ${httpStatus})`
  }
  if (full.length < 500) {
    return summary
  }
  const cap = 3200
  return `${summary}\n[Azan body: ${full.slice(0, cap)}${full.length > cap ? '…' : ''}]`
}

/** When Azan accepts the request but rejects every line (wrong SKU, supplier, or env vs synced catalog). */
export function appendAzanAllProductsFailedHint(message: string): string {
  if (!/all products failed|every product|no valid product|line.*rejected|sku.*not found|invalid sku/i.test(message)) {
    return message
  }
  return `${message}\n\n— Tips: re-sync the catalog on the *same* host as orders (AZAN_WHOLESALE_BASE_URL). Staging keys + products synced from live (or the reverse) usually cause this. Check AZAN_WHOLESALE_SUPPLIER_NAME matches the supplier string Azan gave you (default AzanWholeSale). Ensure each line’s supplierSku exists on that Azan server.`
}

export function appendAzanInvalidPriceHint(message: string): string {
  if (!/invalid price/i.test(message)) {
    return message
  }
  return `${message}\n\n— We now send the order line’s unit price (what the customer paid), not MRP as unit, and use whole taka by default. Optional env: AZAN_WHOLESALE_ORDER_INTEGER_TAKA=false for decimals. If it still fails, Azan may require your unit/wholesale to match their catalog — confirm with their team.`
}

/**
 * GET order status from Azan.
 * Configure endpoint template in env:
 * AZAN_WHOLESALE_ORDER_STATUS_PATH="/api/orders/status?platform_order_id={platform_order_id}"
 */
export async function fetchAzanOrderStatusByPlatformOrderId(platformOrderId: number) {
  const tpl = process.env.AZAN_WHOLESALE_ORDER_STATUS_PATH
  if (!tpl?.trim()) {
    return { ok: false, status: 400, data: { message: 'AZAN_WHOLESALE_ORDER_STATUS_PATH not configured' } }
  }
  const path = tpl.replace('{platform_order_id}', encodeURIComponent(String(platformOrderId)))
  return getJson(path)
}

/** POST /api/update-stock */
export async function submitAzanStockUpdate(payload: AzanStockPayload) {
  return postJson('/api/update-stock', payload)
}

/** POST /api/update-product */
export async function submitAzanProductUpdate(payload: AzanProductUpdatePayload) {
  return postJson('/api/update-product', payload)
}

/** platform_source default for new orders */
export function getAzanPlatformSource(): string {
  return process.env.AZAN_WHOLESALE_PLATFORM_SOURCE || 'Halalzi'
}

/**
 * Order forwarding to Azan (POST /api/orders/store) is opt-in.
 * Accept common truthy values so production (e.g. Vercel) is not broken by "1" vs "true".
 */
export function isAzanOrderForwardingEnabled(): boolean {
  const raw = (process.env.AZAN_WHOLESALE_FORWARD_ORDERS || '').trim().toLowerCase()
  if (!raw) return false
  return ['true', '1', 'yes', 'on'].includes(raw)
}

export function getAzanOrderForwardEnvSummary(): {
  forwardOrdersEnabled: boolean
  hasApiCredentials: boolean
  apiBaseUrl: string
  /** True when AZAN_WHOLESALE_BASE_URL is not set (defaults to live API host). */
  usingDefaultBaseUrl: boolean
} {
  const usingDefaultBaseUrl = !process.env.AZAN_WHOLESALE_BASE_URL?.trim()
  return {
    forwardOrdersEnabled: isAzanOrderForwardingEnabled(),
    hasApiCredentials: Boolean(
      process.env.AZAN_WHOLESALE_APP_ID?.trim() && process.env.AZAN_WHOLESALE_SECRET_KEY?.trim(),
    ),
    apiBaseUrl: (() => {
      try {
        return new URL(getAzanWholesaleApiBaseUrl()).origin
      } catch {
        return 'https://api.azanwholesale.com'
      }
    })(),
    usingDefaultBaseUrl,
  }
}
