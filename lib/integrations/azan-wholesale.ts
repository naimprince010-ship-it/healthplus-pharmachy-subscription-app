/**
 * Azan Wholesale API helpers (orders + stock).
 * Auth: App-Id + Secret-Key (same as product sync). Base URL from AZAN_WHOLESALE_BASE_URL.
 */

function getBaseUrl(): string {
  const u = process.env.AZAN_WHOLESALE_BASE_URL || 'https://api.azanwholesale.com'
  return u.replace(/\/$/, '')
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

/** Line item for POST /api/orders/store (Azan docs — adjust fields if their API changes). */
export interface AzanOrderLine {
  name: string
  sales_price: number
  discount?: number
  quantity: number
  supplier?: string
  mrp_price?: number
  unit_price: number
  total_price: number
  wholesale_price?: number
  reward_point_used?: number
  supplier_product_id?: number
  sku?: string | number
}

export interface AzanOrderPayload {
  date: string
  order_details: AzanOrderLine[]
  platform_source: string
  platform_user_id?: string
  order_source?: string
  shipping_address: {
    name: string
    email?: string
    phone?: string
    address: string
  }
  platform_order_id: number
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
