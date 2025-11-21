'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye } from 'lucide-react'

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
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        prescription.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : prescription.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {prescription.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(prescription.fileUrl, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {prescription.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateStatus(prescription.id, 'APPROVED')}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => updateStatus(prescription.id, 'REJECTED')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
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
