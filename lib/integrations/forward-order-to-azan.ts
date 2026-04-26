import { format } from 'date-fns'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  appendAzanAllProductsFailedHint,
  appendAzanInvalidPriceHint,
  formatAzanOrderStoreFailureForAdmin,
  getAzanPlatformSource,
  getAzanWholesaleApiBaseUrl,
  isAzanOrderAlreadyExistsResponse,
  isAzanOrderForwardingEnabled,
  submitAzanResellerOrder,
  type AzanOrderLine,
} from '@/lib/integrations/azan-wholesale'
import { getAzanResellerCategoryName, isProductLinkedToAzanCatalog } from '@/lib/integrations/azan-catalog'
import { slugify } from '@/lib/slugify'

function getSupplierNameForLine() {
  return process.env.AZAN_WHOLESALE_SUPPLIER_NAME || 'AzanWholeSale'
}

/**
 * If enabled, send order lines (Azan category products) to Azan POST /api/orders/store.
 * Opt-in: AZAN_WHOLESALE_FORWARD_ORDERS=true|1|yes|on
 */
export async function forwardOrderToAzanById(orderId: string): Promise<{
  ok: boolean
  skipped?: string
  lineCount?: number
  error?: string
}> {
  if (!isAzanOrderForwardingEnabled()) {
    return { ok: true, skipped: 'forward_orders_disabled' }
  }
  if (!process.env.AZAN_WHOLESALE_APP_ID || !process.env.AZAN_WHOLESALE_SECRET_KEY) {
    const msg = 'Missing Azan API credentials'
    await prisma.order.update({ where: { id: orderId }, data: { azanPushError: msg } }).catch(() => {})
    return { ok: false, error: msg }
  }

  const categoryName = getAzanResellerCategoryName()

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      address: { include: { zone: { select: { name: true } } } },
      items: {
        include: {
          product: { include: { category: { select: { name: true } } } },
          medicine: true,
        },
      },
    },
  })

  if (!order) {
    return { ok: false, error: 'Order not found' }
  }

  if (order.azanPushedAt) {
    return { ok: true, skipped: 'already_pushed' }
  }

  const addressParts = [
    order.address.addressLine1,
    order.address.addressLine2,
    order.address.city,
    order.address.zone.name,
  ].filter(Boolean) as string[]

  const shippingText = addressParts.join(', ')

  const details: AzanOrderLine[] = []
  const intTaka = isAzanOrderIntegerTaka()

  for (const line of order.items) {
    if (line.medicineId) continue
    if (!line.product) continue
    if (!isProductLinkedToAzanCatalog(line.product, categoryName)) continue
    if (line.product.deletedAt) continue

    const p = line.product
    const sku = p.supplierSku || extractSkuFromSlug(p.slug)
    if (!sku) {
      console.warn(
        `[Azan] Order ${order.orderNumber}: product ${p.id} has no supplierSku; set from catalog sync. Skipping line.`,
      )
      continue
    }

    // Prefer order-line snapshot (what customer paid), then live selling, then MRP. Sending MRP as unit
    // while the sale was at line.price is a common cause of Azan "Invalid price".
    const rawUnit = resolveAzanLineUnitBdt(p, line)
    if (rawUnit == null || rawUnit <= 0 || !Number.isFinite(rawUnit)) {
      console.warn(
        `[Azan] Order ${order.orderNumber}: product ${p.id} has invalid line price, skipping line.`,
      )
      continue
    }
    const lineUnit = toAzanBdtAmount(rawUnit, intTaka)
    const mrpVal = Math.max(rawUnit, p.mrp != null && p.mrp > 0 ? p.mrp : rawUnit)
    const mrp = toAzanBdtAmount(mrpVal, intTaka)
    const wholesale = toAzanBdtAmount(computeWholesaleForAzanLineRaw(p.purchasePrice, rawUnit), intTaka)
    const totalLine = toAzanBdtAmount(lineUnit * line.quantity, intTaka)

    const linePayload: AzanOrderLine = {
      product_id: p.id,
      name: p.name,
      sales_price: lineUnit,
      discount: 0,
      quantity: line.quantity,
      supplier: getSupplierNameForLine(),
      mrp_price: mrp,
      unit_price: lineUnit,
      total_price: totalLine,
      wholesale_price: wholesale,
      reward_point_used: 0,
    }
    if (p.supplierProductId != null) {
      linePayload.supplier_product_id = p.supplierProductId
    }
    // Azan sample uses numeric barcode when it is all digits
    const skuStr = String(sku)
    if (/^\d{4,20}$/.test(skuStr)) {
      const n = Number(skuStr)
      if (Number.isSafeInteger(n)) linePayload.sku = n
      else linePayload.sku = skuStr
    } else {
      linePayload.sku = skuStr
    }

    details.push(linePayload)
  }

  if (details.length === 0) {
    return { ok: true, skipped: 'no_azan_lines' }
  }

  const now = new Date()
  const platformOrderId = extractIntegerOrderId(order.orderNumber, order.id)
  if (!platformOrderId) {
    const msg = `Could not derive integer platform_order_id from orderNumber=${order.orderNumber}`
    await prisma.order.update({
      where: { id: orderId },
      data: { azanPushError: msg },
    })
    return { ok: false, lineCount: details.length, error: msg }
  }
  const platformUserId = extractIntegerUserId(order.userId, order.user.phone)
  if (!platformUserId) {
    const msg = `Could not derive integer platform_user_id from userId=${order.userId}`
    await prisma.order.update({
      where: { id: orderId },
      data: { azanPushError: msg },
    })
    return { ok: false, lineCount: details.length, error: msg }
  }

  // Azan validates grand_total against line totals; order.total often includes delivery / discounts.
  const grandFromLines = toAzanBdtAmount(
    details.reduce((s, d) => s + d.total_price, 0),
    intTaka,
  )

  const payload = {
    date: format(now, 'yyyy-MM-dd HH:mm:ss'),
    order_details: details,
    platform_source: getAzanPlatformSource(),
    platform_user_id: String(platformUserId),
    order_source: 'website',
    shipping_address: {
      name: order.address.fullName,
      email: undefined,
      phone: order.address.phone,
      address: shippingText,
    },
    platform_order_id: String(platformOrderId),
    grand_total: grandFromLines,
  }

  const res = await submitAzanResellerOrder(payload)
  const azanMeta = extractAzanOrderMetaFromResponse(res.data)

  if (res.ok) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        azanPushedAt: now,
        azanPushError: null,
        azanOrderId: azanMeta.azanOrderId,
        azanStatus: azanMeta.azanStatus,
        azanTrackingNumber: azanMeta.trackingNumber,
        azanCourierName: azanMeta.courierName,
        azanTrackingUrl: azanMeta.trackingUrl,
        azanStatusRaw: toNullableInputJsonValue(res.data),
        azanStatusSyncedAt: now,
      },
    })
    return { ok: true, lineCount: details.length }
  }

  // Duplicate platform_order_id: order is already at Azan — mark forwarded so status sync / admin UI stay consistent.
  if (isAzanOrderAlreadyExistsResponse(res.data)) {
    const meta = extractAzanOrderMetaFromResponse(res.data)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        azanPushedAt: now,
        azanPushError: null,
        ...(meta.azanOrderId ? { azanOrderId: meta.azanOrderId } : {}),
        ...(meta.azanStatus ? { azanStatus: meta.azanStatus } : {}),
        ...(meta.trackingNumber ? { azanTrackingNumber: meta.trackingNumber } : {}),
        ...(meta.courierName ? { azanCourierName: meta.courierName } : {}),
        ...(meta.trackingUrl ? { azanTrackingUrl: meta.trackingUrl } : {}),
        azanStatusRaw: toNullableInputJsonValue(res.data),
      },
    })
    return { ok: true, lineCount: details.length, skipped: 'already_exists_at_azan' }
  }

  const errText = formatAzanOrderStoreFailureForAdmin(res.data, res.status)
  const withProductHint = appendAzanAllProductsFailedHint(errText)
  const withPriceHint = appendAzanInvalidPriceHint(withProductHint)
  const withAuth = appendAzanApiAuthErrorHint(withPriceHint)
  const final = withAuth.length > 4000 ? withAuth.slice(0, 4000) : withAuth
  await prisma.order.update({
    where: { id: orderId },
    data: {
      azanPushError: final,
      azanStatusRaw: toNullableInputJsonValue(res.data),
    },
  })
  return { ok: false, lineCount: details.length, error: final }
}

/**
 * Azan "Invalid App-ID or Secret-Key" usually means credentials don't match the **host** being called
 * (e.g. sandbox keys + default https://api.azanwholesale.com).
 */
function appendAzanApiAuthErrorHint(message: string): string {
  const m = message.toLowerCase()
  if (!/invalid app|secret-key|unauthorized|app-id|secret key/.test(m)) {
    return message
  }
  const base = getAzanWholesaleApiBaseUrl()
  return `${message} [Current API: ${base}. Sandbox keys only work on the sandbox base URL. Set AZAN_WHOLESALE_BASE_URL to the same host Azan gave you for those keys, e.g. https://staging.azanwholesale.com, redeploy, retry.]`
}

/** Last slug segment if it looks like a numeric barcode. */
function extractSkuFromSlug(slug: string): string | null {
  const parts = slug.split('-').filter(Boolean)
  const last = parts[parts.length - 1]
  if (last && /^\d{4,20}$/.test(last)) return last
  return null
}

/** Azan validates platform_order_id as integer. */
function extractIntegerOrderId(orderNumber: string, orderId: string): number | null {
  const fromOrderNo = orderNumber.replace(/\D/g, '')
  if (fromOrderNo) {
    const n = Number(fromOrderNo)
    if (Number.isSafeInteger(n) && n > 0) return n
  }

  const fromId = orderId.replace(/\D/g, '')
  if (fromId) {
    const n = Number(fromId)
    if (Number.isSafeInteger(n) && n > 0) return n
  }

  return null
}

/**
 * Azan validates platform_user_id as integer.
 * Prefer numeric DB ids, then phone digits as stable fallback.
 */
function extractIntegerUserId(userId: string, phone?: string | null): number | null {
  const fromUserId = userId.replace(/\D/g, '')
  if (fromUserId) {
    const n = Number(fromUserId)
    if (Number.isSafeInteger(n) && n > 0) return n
  }

  const fromPhone = (phone || '').replace(/\D/g, '')
  if (fromPhone) {
    const n = Number(fromPhone)
    if (Number.isSafeInteger(n) && n > 0) return n
  }

  return null
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * When true (default), send whole-taka amounts — some Azan builds reject float cents.
 * Set AZAN_WHOLESALE_ORDER_INTEGER_TAKA=false to use two decimal places.
 */
function isAzanOrderIntegerTaka(): boolean {
  const raw = (process.env.AZAN_WHOLESALE_ORDER_INTEGER_TAKA || 'true').trim().toLowerCase()
  if (!raw) return true
  return !['false', '0', 'no', 'off'].includes(raw)
}

function toAzanBdtAmount(n: number, asInteger: boolean): number {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (asInteger) return Math.max(1, Math.round(n))
  return roundMoney(n)
}

/** Order line unit in BDT: what was charged (snapshot), then product selling price, then MRP. */
function resolveAzanLineUnitBdt(
  p: { mrp: number | null; sellingPrice: number },
  line: { price: number },
): number | null {
  if (line.price > 0 && Number.isFinite(line.price)) {
    return line.price
  }
  if (p.sellingPrice > 0 && Number.isFinite(p.sellingPrice)) {
    return p.sellingPrice
  }
  if (p.mrp != null && p.mrp > 0 && Number.isFinite(p.mrp)) {
    return p.mrp
  }
  return null
}

/**
 * Azan often rejects wholesale_price = 0. Prefer supplier cost; else a safe fraction of raw unit.
 */
function computeWholesaleForAzanLineRaw(purchase: number | null | undefined, rawUnit: number): number {
  if (typeof purchase === 'number' && Number.isFinite(purchase) && purchase > 0) {
    const w = roundMoney(purchase)
    if (w < rawUnit) return w
  }
  return roundMoney(Math.max(0.01, rawUnit * 0.5))
}

function extractAzanOrderMetaFromResponse(data: unknown): {
  azanOrderId: string | null
  azanStatus: string | null
  trackingNumber: string | null
  courierName: string | null
  trackingUrl: string | null
} {
  if (!data || typeof data !== 'object') {
    return { azanOrderId: null, azanStatus: null, trackingNumber: null, courierName: null, trackingUrl: null }
  }
  const bag = data as Record<string, unknown>
  const readString = (...keys: string[]) => {
    for (const key of keys) {
      const v = bag[key]
      if (typeof v === 'string' && v.trim()) return v.trim()
      if (typeof v === 'number') return String(v)
    }
    return null
  }

  return {
    azanOrderId: readString('order_id', 'orderId', 'id', 'azan_order_id', 'platform_order_id'),
    azanStatus: readString('status', 'order_status', 'delivery_status'),
    trackingNumber: readString('tracking_number', 'trackingNo', 'consignment_id'),
    courierName: readString('courier_name', 'courier', 'delivery_partner'),
    trackingUrl: readString('tracking_url', 'trackingUrl'),
  }
}

function toNullableInputJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) return Prisma.JsonNull
  return value as Prisma.InputJsonValue
}
