'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Package, ShoppingBag, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { MAIN_CONTAINER } from '@/lib/layout'

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  items: Array<{
    medicine: {
      name: string
    }
    quantity: number
  }>
}

interface Subscription {
  id: string
  plan: {
    name: string
    price: number
  }
  nextDeliveryDate: string
  isActive: boolean
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/orders').then((res) => res.json()),
        fetch('/api/subscriptions').then((res) => res.json()),
      ])
        .then(([ordersData, subscriptionsData]) => {
          if (ordersData.orders) setOrders(ordersData.orders)
          if (subscriptionsData.subscriptions) setSubscriptions(subscriptionsData.subscriptions)
        })
        .catch((err) => console.error('Failed to fetch dashboard data:', err))
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, {session.user.name}</p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center gap-4">
              <ShoppingBag className="h-12 w-12 text-teal-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center gap-4">
              <Package className="h-12 w-12 text-teal-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter((s) => s.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center gap-4">
              <CreditCard className="h-12 w-12 text-teal-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">৳0</p>
                <p className="text-sm text-gray-600">Membership Status</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link href="/dashboard/orders" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center shadow">
                  <p className="text-gray-600">No orders yet</p>
                  <Link
                    href="/medicines"
                    className="mt-2 inline-block text-sm font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Start Shopping →
                  </Link>
                </div>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="rounded-lg bg-white p-4 shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {order.items.length} items • ৳{order.total}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Active Subscriptions</h2>
              <Link
                href="/subscriptions"
                className="text-sm font-semibold text-teal-600 hover:text-teal-700"
              >
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {subscriptions.filter((s) => s.isActive).length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center shadow">
                  <p className="text-gray-600">No active subscriptions</p>
                  <Link
                    href="/subscriptions"
                    className="mt-2 inline-block text-sm font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Browse Plans →
                  </Link>
                </div>
              ) : (
                subscriptions
                  .filter((s) => s.isActive)
                  .slice(0, 5)
                  .map((subscription) => (
                    <div key={subscription.id} className="rounded-lg bg-white p-4 shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{subscription.plan.name}</p>
                          <p className="text-sm text-gray-600">
                            Next delivery:{' '}
                            {new Date(subscription.nextDeliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">৳{subscription.plan.price}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
