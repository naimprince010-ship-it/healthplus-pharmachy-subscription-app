import type { OrderStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { fetchAzanOrderStatusByPlatformOrderId } from '@/lib/integrations/azan-wholesale'

type AzanStatusMeta = {
  rawStatus: string | null
  trackingNumber: string | null
  courierName: string | null
  trackingUrl: string | null
  azanOrderId: string | null
}

export async function syncAzanStatusForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      azanPushedAt: true,
      azanOrderId: true,
    },
  })
  if (!order) return { ok: false as const, error: 'Order not found' }
  if (!order.azanPushedAt) return { ok: true as const, skipped: 'not_forwarded' }

  const platformOrderId = extractIntegerOrderId(order.orderNumber, order.id)
  if (!platformOrderId) return { ok: false as const, error: 'Could not derive platform_order_id' }

  const res = await fetchAzanOrderStatusByPlatformOrderId(platformOrderId)
  const now = new Date()
  if (!res.ok) {
    const msg =
      typeof res.data === 'object' && res.data !== null && 'message' in res.data
        ? String((res.data as { message: unknown }).message)
        : `HTTP ${res.status}`
    await prisma.order.update({
      where: { id: order.id },
      data: { azanPushError: `Status sync failed: ${msg}`.slice(0, 4000) },
    })
    return { ok: false as const, error: msg }
  }

  const meta = extractAzanOrderMeta(res.data)
  const mappedStatus = mapAzanStatusToOrderStatus(meta.rawStatus)

  const updates: Prisma.OrderUpdateInput = {
    azanOrderId: meta.azanOrderId || order.azanOrderId,
    azanStatus: meta.rawStatus,
    azanTrackingNumber: meta.trackingNumber,
    azanCourierName: meta.courierName,
    azanTrackingUrl: meta.trackingUrl,
    azanStatusRaw: res.data as Prisma.JsonValue,
    azanStatusSyncedAt: now,
    azanPushError: null,
  }
  if (mappedStatus && mappedStatus !== order.status) {
    updates.status = mappedStatus
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: updates })
    if (mappedStatus && mappedStatus !== order.status) {
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: mappedStatus, note: `Auto synced from Azan: ${meta.rawStatus ?? 'unknown'}` },
      })
    }
  })

  return {
    ok: true as const,
    mappedStatus,
    azanStatus: meta.rawStatus,
    trackingNumber: meta.trackingNumber,
  }
}

function extractAzanOrderMeta(data: unknown): AzanStatusMeta {
  const out: AzanStatusMeta = {
    rawStatus: null,
    trackingNumber: null,
    courierName: null,
    trackingUrl: null,
    azanOrderId: null,
  }
  if (!data || typeof data !== 'object') return out

  const bag = data as Record<string, unknown>
  const nested =
    typeof bag.data === 'object' && bag.data !== null
      ? (bag.data as Record<string, unknown>)
      : undefined

  const readString = (keys: string[]) => {
    for (const source of [bag, nested].filter(Boolean) as Record<string, unknown>[]) {
      for (const key of keys) {
        const v = source[key]
        if (typeof v === 'string' && v.trim()) return v.trim()
        if (typeof v === 'number') return String(v)
      }
    }
    return null
  }

  out.rawStatus = readString(['status', 'order_status', 'delivery_status', 'fulfillment_status'])
  out.trackingNumber = readString(['tracking_number', 'trackingNo', 'consignment_id'])
  out.courierName = readString(['courier_name', 'courier', 'delivery_partner'])
  out.trackingUrl = readString(['tracking_url', 'trackingUrl'])
  out.azanOrderId = readString(['order_id', 'orderId', 'id', 'azan_order_id'])
  return out
}

function mapAzanStatusToOrderStatus(status: string | null): OrderStatus | null {
  if (!status) return null
  const s = status.trim().toLowerCase()
  if (['pending', 'new', 'placed'].includes(s)) return 'PENDING'
  if (['confirmed', 'accepted'].includes(s)) return 'CONFIRMED'
  if (['processing', 'packed', 'ready_to_ship'].includes(s)) return 'PROCESSING'
  if (['shipped', 'dispatch', 'in_transit', 'out_for_delivery'].includes(s)) return 'SHIPPED'
  if (['delivered', 'completed', 'success'].includes(s)) return 'DELIVERED'
  if (['cancelled', 'canceled', 'failed', 'returned'].includes(s)) return 'CANCELLED'
  return null
}

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
