'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Zone {
  id: string
  name: string
  description?: string
  deliveryFee?: number
  deliveryCharge: number
  deliveryDays: string
  isActive: boolean
  sortOrder: number
}

export default function DeliveryZonesPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [authStatus, router])

  useEffect(() => {
    if (session) {
      fetchZones()
    }
  }, [session])

  async function fetchZones() {
    try {
      const response = await fetch('/api/admin/zones')
      const data = await response.json()
      setZones(data.zones)
    } catch (error) {
      console.error('Failed to fetch zones:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will deactivate it if it has associated addresses or orders.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/zones/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'Zone deleted successfully')
        fetchZones()
      } else {
        alert(`Failed to delete zone: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to delete zone:', error)
      alert('Failed to delete zone')
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/admin/zones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        fetchZones()
      } else {
        const data = await response.json()
        alert(`Failed to update zone: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to update zone:', error)
      alert('Failed to update zone')
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
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Zones</h1>
          <button
            onClick={() => router.push('/admin/delivery-zones/new')}
            className="flex items-center rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Zone
          </button>
        </div>

        {zones.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">No delivery zones found. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Zone Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Delivery Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {zones.map((zone) => {
                  const fee = zone.deliveryFee ?? zone.deliveryCharge
                  return (
                    <tr key={zone.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {zone.sortOrder}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {zone.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {zone.description || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        ৳{fee} BDT
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleActive(zone.id, zone.isActive)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            zone.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/delivery-zones/${zone.id}/edit`)}
                          className="mr-3 text-teal-600 hover:text-teal-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id, zone.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
