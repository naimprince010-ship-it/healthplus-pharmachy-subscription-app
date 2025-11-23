'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'

interface Prescription {
  id: string
  name: string
  phone: string
  fileUrl: string
  status: string
  createdAt: string
  user: {
    name: string
    phone: string
  }
}

const STATUS_OPTIONS = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
const STATUS_COLORS = {
  NEW: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
} as const

export default function AdminPrescriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        const response = await fetch('/api/prescriptions')
        const data = await response.json()
        setPrescriptions(data.prescriptions || [])
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchPrescriptions()
    }
  }, [session])

  async function updateStatus(id: string, status: string) {
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        setPrescriptions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status } : p))
        )
      }
    } catch (error) {
      console.error('Failed to update prescription:', error)
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
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Prescription Management</h1>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {prescriptions.map((prescription) => (
                <tr key={prescription.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {prescription.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {prescription.phone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <select
                      value={prescription.status}
                      onChange={(e) => updateStatus(prescription.id, e.target.value)}
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border-0 cursor-pointer ${
                        STATUS_COLORS[prescription.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      onClick={() => window.open(prescription.fileUrl, '_blank')}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      title="View / Download Prescription"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View File
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {prescriptions.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No prescriptions found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
