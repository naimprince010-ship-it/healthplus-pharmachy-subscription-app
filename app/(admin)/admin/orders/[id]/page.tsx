'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Package, User, MapPin, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  medicineId: string | null
  productId: string | null
  quantity: number
  price: number
  total: number
  medicine: {
    name: string
    imageUrl: string | null
  } | null
  product: {
    name: string
    imageUrl: string | null
  } | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  discount: number
  deliveryCharge: number
  total: number
  paymentMethod: string
  paymentStatus: string
  notes: string | null
  createdAt: string
  updatedAt: string
  user: {
    name: string
    phone: string
    email: string | null
  }
  address: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2: string | null
    city: string
    zone: {
      name: string
      deliveryCharge: number
    }
  }
  items: OrderItem[]
}

const statusFlow = [
  { key: 'PENDING', label: 'Pending', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'Out for Delivery', icon: Package },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
]

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const orderId = params?.id
  
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    if (!orderId) {
      setError('Order ID is missing')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        credentials: 'include',
      })
      
      if (response.status === 404) {
        setError('Order not found')
        setIsLoading(false)
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }
      
      const data = await response.json()
      setOrder(data.order)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order details')
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!order || !orderId) return

    setIsUpdating(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    )
  }

  const currentStatusIndex = statusFlow.findIndex((s) => s.key === order.status)
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
              order.status === 'DELIVERED'
                ? 'bg-green-100 text-green-800'
                : order.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : order.status === 'SHIPPED'
                ? 'bg-blue-100 text-blue-800'
                : order.status === 'CONFIRMED' || order.status === 'PROCESSING'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {order.status}
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Order Status Timeline</h2>
          
          {isCancelled ? (
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Order Cancelled</p>
                <p className="text-sm text-red-700">This order has been cancelled</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center justify-between">
                {statusFlow.map((status, index) => {
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex
                  const StatusIcon = status.icon

                  return (
                    <div key={status.key} className="flex flex-1 flex-col items-center">
                      <div className="relative flex w-full items-center">
                        {index > 0 && (
                          <div
                            className={`h-1 flex-1 ${
                              isCompleted ? 'bg-teal-600' : 'bg-gray-200'
                            }`}
                          />
                        )}
                        <div
                          className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 ${
                            isCompleted
                              ? 'border-teal-600 bg-teal-600'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <StatusIcon
                            className={`h-6 w-6 ${
                              isCompleted ? 'text-white' : 'text-gray-400'
                            }`}
                          />
                        </div>
                        {index < statusFlow.length - 1 && (
                          <div
                            className={`h-1 flex-1 ${
                              index < currentStatusIndex ? 'bg-teal-600' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                      <p
                        className={`mt-2 text-center text-sm font-medium ${
                          isCurrent ? 'text-teal-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {status.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {!isCancelled && order.status !== 'DELIVERED' && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Update Order Status</h2>
            <div className="flex flex-wrap gap-3">
              {order.status === 'PENDING' && (
                <button
                  onClick={() => updateStatus('CONFIRMED')}
                  disabled={isUpdating}
                  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Mark as Confirmed
                </button>
              )}
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={() => updateStatus('PROCESSING')}
                  disabled={isUpdating}
                  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Mark as Processing
                </button>
              )}
              {order.status === 'PROCESSING' && (
                <button
                  onClick={() => updateStatus('SHIPPED')}
                  disabled={isUpdating}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Mark as Out for Delivery
                </button>
              )}
              {order.status === 'SHIPPED' && (
                <button
                  onClick={() => updateStatus('DELIVERED')}
                  disabled={isUpdating}
                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                >
                  Mark as Delivered
                </button>
              )}
              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                <button
                  onClick={() => updateStatus('CANCELLED')}
                  disabled={isUpdating}
                  className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Customer Information</h2>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{order.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{order.user.phone}</p>
                </div>
                {order.user.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{order.user.email}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Recipient</p>
                  <p className="font-medium text-gray-900">{order.address.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{order.address.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">
                    {order.address.addressLine1}
                    {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                  </p>
                  <p className="font-medium text-gray-900">{order.address.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Zone</p>
                  <p className="font-medium text-gray-900">{order.address.zone.name}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Payment Information</h2>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium text-gray-900">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className="font-medium text-gray-900">{order.paymentStatus}</p>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-2 text-lg font-bold text-gray-900">Order Notes</h2>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          <div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
              </div>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const itemName = item.medicine?.name ?? item.product?.name ?? 'Unknown Item'
                  return (
                    <div key={item.id} className="flex items-start gap-4 border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{itemName}</p>
                        <p className="text-sm text-gray-600">
                          ৳{item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">৳{item.total.toFixed(2)}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">৳{order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-৳{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Charge</span>
                  <span className="font-medium text-gray-900">৳{order.deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">৳{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
