'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import { MAIN_CONTAINER } from '@/lib/layout'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  items: Array<{
    medicine: {
      name: string
    }
    quantity: number
    price: number
  }>
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/dashboard/orders')
      return
    }

    if (status === 'authenticated') {
      fetch('/api/orders')
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch orders')
          }
          return res.json()
        })
        .then((data) => {
          if (data.orders) {
            setOrders(data.orders)
          }
        })
        .catch((err) => {
          console.error('Failed to fetch orders:', err)
          setError('Failed to load orders. Please try again.')
        })
        .finally(() => setIsLoading(false))
    }
  }, [status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className={MAIN_CONTAINER}>
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-600">{orders.length} total orders</p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-8">
          {orders.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <Package className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No orders yet</h3>
              <p className="mt-2 text-gray-600">Start shopping to see your orders here</p>
              <Link
                href="/medicines"
                className="mt-4 inline-block rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Browse Medicines
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber || order.id.slice(0, 8)}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            order.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>

                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Items:</p>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {item.medicine.name} x {item.quantity}
                            </span>
                            <span className="font-medium text-gray-900">
                              ৳{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ml-6 text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">৳{order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm font-semibold text-teal-600 hover:text-teal-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
