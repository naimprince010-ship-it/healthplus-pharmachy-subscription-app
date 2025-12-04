'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ChevronRight, ArrowLeft } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    medicine?: { name: string } | null
    product?: { name: string } | null
  }>
}

export default function OrdersPage() {
  const { status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data.orders) setOrders(data.orders)
        })
        .catch((err) => console.error('Failed to fetch orders:', err))
        .finally(() => setIsLoading(false))
    }
  }, [status, router])

  const getStatusBadgeClass = (orderStatus: string) => {
    switch (orderStatus) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-600'
      case 'CANCELLED':
        return 'bg-red-100 text-red-600'
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-600'
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-yellow-100 text-yellow-600'
    }
  }

  const getStatusText = (orderStatus: string) => {
    switch (orderStatus) {
      case 'DELIVERED':
        return 'ডেলিভারি সম্পন্ন'
      case 'CANCELLED':
        return 'বাতিল'
      case 'SHIPPED':
        return 'শিপড'
      case 'PROCESSING':
        return 'প্রসেসিং'
      case 'PENDING':
        return 'পেন্ডিং'
      default:
        return orderStatus
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 h-20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">আমার অর্ডার</h1>
            <p className="text-sm text-gray-500">মোট {orders.length} টি অর্ডার</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">এখনো কোনো অর্ডার নেই</p>
              <Link
                href="/products"
                className="inline-block px-6 py-2 bg-[#0A9F6E] text-white rounded-full font-medium hover:bg-[#088a5b] transition-colors"
              >
                শপিং শুরু করুন
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <ShoppingBag className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items.length} items • ৳{order.total}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('bn-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
