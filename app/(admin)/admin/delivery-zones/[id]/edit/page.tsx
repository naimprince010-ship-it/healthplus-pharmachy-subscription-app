'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditDeliveryZonePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [zoneId, setZoneId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    deliveryFee: '',
    deliveryDays: '',
    sortOrder: '',
    isActive: true,
  })

  useEffect(() => {
    params.then(p => {
      setZoneId(p.id)
      fetchZone(p.id)
    })
  }, [params])

  async function fetchZone(id: string) {
    try {
      const response = await fetch(`/api/admin/zones/${id}`)
      const data = await response.json()

      if (response.ok) {
        const zone = data.zone
        const fee = zone.deliveryFee ?? zone.deliveryCharge
        setForm({
          name: zone.name,
          description: zone.description || '',
          deliveryFee: fee.toString(),
          deliveryDays: zone.deliveryDays,
          sortOrder: zone.sortOrder.toString(),
          isActive: zone.isActive,
        })
      } else {
        alert('Failed to load zone')
        router.push('/admin/delivery-zones')
      }
    } catch (error) {
      console.error('Failed to fetch zone:', error)
      alert('Failed to load zone')
      router.push('/admin/delivery-zones')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          deliveryFee: parseInt(form.deliveryFee),
          deliveryDays: form.deliveryDays,
          sortOrder: parseInt(form.sortOrder),
          isActive: form.isActive,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Zone updated successfully!')
        router.push('/admin/delivery-zones')
      } else {
        alert(`Failed to update zone: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to update zone:', error)
      alert('Failed to update zone')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Edit Delivery Zone</h1>
          <button
            onClick={() => router.push('/admin/delivery-zones')}
            className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Back to List
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Zone Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="List of areas covered (e.g., Area 1, Area 2, Area 3)"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Delivery Fee (BDT) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
                min="1"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Delivery Days
              </label>
              <input
                type="text"
                value={form.deliveryDays}
                onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 1-2 days"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/delivery-zones')}
                className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-600 px-6 py-2 text-white hover:bg-teal-700 disabled:bg-gray-300"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
