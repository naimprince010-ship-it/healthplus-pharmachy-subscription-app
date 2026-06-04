'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'CLOSED'

interface ReturnItemView {
  id: string
  quantity: number
  note?: string | null
  orderItem: {
    id: string
    quantity: number
    price: number
    total: number
    productName?: string | null
    medicine?: { name: string } | null
    product?: { name: string } | null
  }
}

interface ReturnDetail {
  id: string
  status: ReturnStatus
  reason: string
  customerNote?: string | null
  adminNote?: string | null
  requestedAt: string
  reviewedAt?: string | null
  closedAt?: string | null
  order: { id: string; orderNumber: string; total: number; status: string }
  user: { id: string; name: string; phone: string }
  items: ReturnItemView[]
  statusHistory: Array<{
    id: string
    fromStatus?: ReturnStatus | null
    toStatus: ReturnStatus
    note?: string | null
    changedAt: string
  }>
}

const statusOptions: ReturnStatus[] = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'CLOSED']

export default function ReturnDetailsPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [data, setData] = useState<ReturnDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus>('REQUESTED')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const requiresNote = selectedStatus === 'REJECTED' || selectedStatus === 'CLOSED'
  const noteMissing = requiresNote && note.trim().length === 0

  const allowedStatusOptions = useMemo(() => {
    if (!data) return statusOptions
    return statusOptions.filter((status) => status !== data.status)
  }, [data])

  useEffect(() => {
    if (!id) return
    void fetchReturn()
  }, [id])

  async function fetchReturn() {
    if (!id) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/returns/${encodeURIComponent(id)}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch return request')

      const json = await res.json()
      const request = json.returnRequest as ReturnDetail
      setData(request)
      setSelectedStatus(request.status)
      setNote(request.adminNote || '')
    } catch (e) {
      console.error(e)
      setError('Failed to load return request')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus() {
    if (!id || !data) return

    if (noteMissing) {
      setError('A note is required when status is REJECTED or CLOSED')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/returns/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, note }),
        credentials: 'include',
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update status')
      }

      await fetchReturn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update return request')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-600">Loading return request...</div>
  }

  if (error && !data) {
    return <div className="p-8 text-red-700">{error}</div>
  }

  if (!data) {
    return <div className="p-8 text-gray-600">Return request not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href="/admin/returns" className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Returns
        </Link>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Return Request #{data.id.slice(0, 8)}</h1>
              <p className="mt-1 text-sm text-gray-600">Requested on {new Date(data.requestedAt).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Current Status</div>
              <div className="text-lg font-semibold text-gray-900">{data.status}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-md bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Order</div>
              <Link href={`/admin/orders/${data.order.id}`} className="text-sm font-semibold text-teal-600 hover:text-teal-700">
                #{data.order.orderNumber}
              </Link>
              <div className="text-xs text-gray-600">Total: ৳{data.order.total.toFixed(2)}</div>
            </div>
            <div className="rounded-md bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Customer</div>
              <div className="text-sm font-semibold text-gray-900">{data.user.name}</div>
              <div className="text-xs text-gray-600">{data.user.phone}</div>
            </div>
            <div className="rounded-md bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Reason</div>
              <div className="text-sm font-semibold text-gray-900">{data.reason}</div>
            </div>
          </div>

          {data.customerNote && (
            <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              <span className="font-semibold">Customer Note:</span> {data.customerNote}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Returned Items</h2>
          <div className="space-y-3">
            {data.items.map((item) => {
              const label = item.orderItem.productName || item.orderItem.product?.name || item.orderItem.medicine?.name || 'Unnamed item'
              return (
                <div key={item.id} className="rounded-md border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-700">Qty Returned: {item.quantity}</div>
                  </div>
                  {item.note && <div className="mt-2 text-xs text-gray-600">Item note: {item.note}</div>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Update Status</h2>
            {error && <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <div className="space-y-3">
              <label className="block text-sm text-gray-700">
                New Status
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ReturnStatus)}
                >
                  <option value={data.status}>{data.status} (current)</option>
                  {allowedStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-gray-700">
                Admin Note
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={4}
                  placeholder={requiresNote ? 'Required: add reason for this status change' : 'Optional note'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>

              {noteMissing && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  Note is required for REJECTED and CLOSED transitions.
                </div>
              )}

              <button
                type="button"
                onClick={updateStatus}
                disabled={saving || selectedStatus === data.status || noteMissing}
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Timeline</h2>
            <ol className="space-y-3">
              {data.statusHistory.map((entry) => (
                <li key={entry.id} className="rounded-md border border-gray-200 p-3">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.fromStatus ? `${entry.fromStatus} -> ${entry.toStatus}` : `Created as ${entry.toStatus}`}
                  </div>
                  {entry.note && <div className="text-xs text-gray-600">{entry.note}</div>}
                  <div className="mt-1 text-xs text-gray-500">{new Date(entry.changedAt).toLocaleString()}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
