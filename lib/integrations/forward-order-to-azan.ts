import { format } from 'date-fns'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAzanPlatformSource, submitAzanResellerOrder, type AzanOrderLine } from '@/lib/integrations/azan-wholesale'
import { getAzanResellerCategoryName, isProductLinkedToAzanCatalog } from '@/lib/integrations/azan-catalog'
import { slugify } from '@/lib/slugify'

function getSupplierNameForLine() {
  return process.env.AZAN_WHOLESALE_SUPPLIER_NAME || 'AzanWholeSale'
}

/**
 * If enabled, send order lines (Azan category products) to Azan POST /api/orders/store.
 * Opt-in: AZAN_WHOLESALE_FORWARD_ORDERS=true
 */
export async function forwardOrderToAzanById(orderId: string): Promise<{
  ok: boolean
  skipped?: string
  lineCount?: number
  error?: string
}> {
  if (process.env.AZAN_WHOLESALE_FORWARD_ORDERS !== 'true') {
    return { ok: true, skipped: 'AZAN_WHOLESALE_FORWARD_ORDERS is not true' }
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

    const unit = line.price
    const totalLine = line.total
    const wholesale = p.purchasePrice ?? 0
    const mrp = p.mrp ?? p.sellingPrice

    details.push({
      name: p.name,
      sales_price: unit,
      discount: 0,
      quantity: line.quantity,
      supplier: getSupplierNameForLine(),
      mrp_price: mrp,
      unit_price: unit,
      total_price: totalLine,
      wholesale_price: wholesale,
      reward_point_used: 0,
      sku: String(sku),
    })
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

  const payload = {
    date: format(now, 'yyyy-MM-dd HH:mm:ss'),
    order_details: details,
    platform_source: getAzanPlatformSource(),
    platform_user_id: order.userId,
    order_source: 'website',
    shipping_address: {
      name: order.address.fullName,
      email: undefined,
      phone: order.address.phone,
      address: shippingText,
    },
    platform_order_id: platformOrderId,
    grand_total: order.total,
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

  const errText =
    typeof res.data === 'object' && res.data !== null && 'message' in res.data
      ? String((res.data as { message: unknown }).message)
      : `HTTP ${res.status}`

  const truncated = errText.length > 4000 ? errText.slice(0, 4000) : errText
  await prisma.order.update({
    where: { id: orderId },
    data: { azanPushError: truncated },
  })
  return { ok: false, lineCount: details.length, error: errText }
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
