'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type ReturnReason = 'DAMAGED' | 'WRONG_ITEM' | 'EXPIRED' | 'QUALITY_ISSUE' | 'NOT_AS_DESCRIBED' | 'OTHER'

interface OrderItem {
  id: string
  quantity: number
  total: number
  productName?: string | null
  medicine?: { name: string } | null
  product?: { name: string } | null
}

interface OrderView {
  id: string
  orderNumber: string
  total: number
  user: { name: string; phone: string }
  items: OrderItem[]
}

const reasons: ReturnReason[] = ['DAMAGED', 'WRONG_ITEM', 'EXPIRED', 'QUALITY_ISSUE', 'NOT_AS_DESCRIBED', 'OTHER']

export default function NewReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [order, setOrder] = useState<OrderView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reason, setReason] = useState<ReturnReason>('DAMAGED')
  const [customerNote, setCustomerNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    void fetchOrder(orderId)
  }, [orderId])

  async function fetchOrder(id: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load order')

      const json = await res.json()
      const orderData = json.order as OrderView
      setOrder(orderData)
      setQtyMap(
        Object.fromEntries(orderData.items.map((item) => [item.id, 0]))
      )
    } catch (e) {
      console.error(e)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const selectedItems = useMemo(
    () =>
      Object.entries(qtyMap)
        .filter(([, qty]) => qty > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
    [qtyMap]
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!orderId) return

    if (selectedItems.length === 0) {
      setError('Select at least one item quantity to create return request')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          reason,
          customerNote: customerNote || undefined,
          items: selectedItems,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create return request')
      }

      const createdId = json.returnRequest?.id as string | undefined
      if (createdId) {
        router.push(`/admin/returns/${createdId}`)
        return
      }

      router.push('/admin/returns')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create return request')
    } finally {
      setSaving(false)
    }
  }

  if (!orderId) {
    return (
      <div className="p-8">
        <p className="text-gray-700">Missing order ID. Open this page from an order details screen.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="p-8 text-gray-600">Loading order for return request...</div>
  }

  if (!order) {
    return <div className="p-8 text-red-700">{error || 'Order not found'}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Order
        </Link>

        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">Create Return Request</h1>
          <p className="mt-1 text-sm text-gray-600">Order #{order.orderNumber} | {order.user.name} ({order.user.phone})</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <label className="block text-sm text-gray-700">
            Return Reason
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
            >
              {reasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-gray-700">
            Customer Note (optional)
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
            />
          </label>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Select Items & Quantities</h2>
            <div className="space-y-3">
              {order.items.map((item) => {
                const maxQty = item.quantity
                const label = item.productName || item.product?.name || item.medicine?.name || 'Unnamed item'
                return (
                  <div key={item.id} className="flex flex-col gap-3 rounded-md border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{label}</div>
                      <div className="text-xs text-gray-600">Purchased Qty: {maxQty}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Return Qty</span>
                      <input
                        type="number"
                        min={0}
                        max={maxQty}
                        value={qtyMap[item.id] ?? 0}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          const safe = Number.isFinite(value) ? Math.max(0, Math.min(maxQty, value)) : 0
                          setQtyMap((prev) => ({ ...prev, [item.id]: safe }))
                        }}
                        className="w-20 rounded-md border border-gray-300 px-2 py-1"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? 'Creating...' : 'Create Return Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
