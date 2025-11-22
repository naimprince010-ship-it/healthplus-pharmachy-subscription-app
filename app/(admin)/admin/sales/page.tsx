'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react'

interface SalesData {
  totalOrders: number
  totalRevenue: number
  activeSubscriptions: number
  activeMemberships: number
}

export default function AdminSalesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<SalesData>({
    totalOrders: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    activeMemberships: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const response = await fetch('/api/admin/sales')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch sales data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchSalesData()
    }
  }, [session])

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
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Sales Report</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{data.totalOrders}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">৳{data.totalRevenue}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{data.activeSubscriptions}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Memberships</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{data.activeMemberships}</p>
              </div>
              <div className="rounded-full bg-teal-100 p-3">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
