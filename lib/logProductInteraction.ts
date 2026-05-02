/**
 * সার্ভারে প্রোডাক্ট ইন্টারঅ্যাকশন লগ (ভিউ / কার্ট) — ভবিষ্যত রেকমেন্ডেশন ট্রেনিং।
 * ফায়ার-অ্যান্ড-ফরগেট; ব্যর্থ হলে নীরব।
 */
export type ProductInteractionKind = 'VIEW_ITEM' | 'ADD_TO_CART'

export function logProductInteraction(payload: {
  kind: ProductInteractionKind
  productId?: string
  medicineId?: string
}): void {
  if (typeof window === 'undefined') return
  if (!payload.productId && !payload.medicineId) return

  const body = JSON.stringify(payload)
  const url = '/api/recommendation/product-interaction'

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
      return
    }
  } catch {
    /* fall through */
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
