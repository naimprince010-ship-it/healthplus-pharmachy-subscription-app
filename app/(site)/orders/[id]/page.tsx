'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Phone, Loader2, CheckCircle, Circle, MapPin, Clock, RefreshCw, ShoppingCart } from 'lucide-react'
import Image from 'next/image'

interface OrderItem {
  id: string
  quantity: number
  price: number
  total: number
  medicine?: {
    id: string
    name: string
    imageUrl?: string | null
    unit: string
  } | null
  product?: {
    id: string
    name: string
    imageUrl?: string | null
    unit: string
  } | null
}

interface StatusHistory {
  id: string
  status: string
  changedAt: string
  note?: string | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  discount: number
  deliveryCharge: number
  paymentMethod: string
  riderName?: string | null
  riderPhone?: string | null
  estimatedDeliveryAt?: string | null
  estimatedDeliveryText?: string | null
  createdAt: string
  address: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string | null
    city: string
    zone: {
      name: string
    }
  }
  items: OrderItem[]
  statusHistory: StatusHistory[]
}

interface OrderTrackingSettings {
  headerTitlePrefixBn: string
  statusSectionTitleBn: string
  deliverySectionTitleBn: string
  itemsSectionTitleBn: string
  totalLabelBn: string
  placedLabelBn: string
  confirmedLabelBn: string
  processingLabelBn: string
  shippedLabelBn: string
  deliveredLabelBn: string
  cancelledLabelBn: string
  riderLabelBn: string
  callButtonBn: string
  estimatedDeliveryLabelBn: string
  supportTextBn: string
  supportLinkTextBn: string
  supportPhone: string
}

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [settings, setSettings] = useState<OrderTrackingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isReordering, setIsReordering] = useState(false)
  const [reorderMessage, setReorderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/auth/signin?redirect=/orders/${params.id}`)
      return
    }

    if (sessionStatus === 'authenticated') {
      Promise.all([
        fetch(`/api/orders/${params.id}`).then(res => res.json()),
        fetch('/api/order-tracking/settings').then(res => res.json()),
      ])
        .then(([orderData, settingsData]) => {
          if (orderData.error) {
            setError(orderData.error)
          } else {
            setOrder(orderData.order)
          }
          if (settingsData.settings) {
            setSettings(settingsData.settings)
          }
        })
        .catch((err) => {
          console.error('Failed to fetch data:', err)
          setError('Failed to load order details')
        })
        .finally(() => setLoading(false))
    }
  }, [sessionStatus, params.id, router])

  const getStatusLabel = (status: string): string => {
    if (!settings) return status
    switch (status) {
      case 'PENDING':
        return settings.placedLabelBn
      case 'CONFIRMED':
        return settings.confirmedLabelBn
      case 'PROCESSING':
        return settings.processingLabelBn
      case 'SHIPPED':
        return settings.shippedLabelBn
      case 'DELIVERED':
        return settings.deliveredLabelBn
      case 'CANCELLED':
        return settings.cancelledLabelBn
      default:
        return status
    }
  }

  const getStatusTime = (status: string): string | null => {
    if (!order) return null
    
    if (status === 'PENDING') {
      return formatTime(order.createdAt)
    }
    
    const historyEntry = order.statusHistory.find(h => h.status === status)
    return historyEntry ? formatTime(historyEntry.changedAt) : null
  }

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStepState = (status: string): 'completed' | 'active' | 'pending' => {
    if (!order) return 'pending'
    
    const currentIndex = STATUS_ORDER.indexOf(order.status)
    const stepIndex = STATUS_ORDER.indexOf(status)
    
    if (order.status === 'CANCELLED') {
      return 'pending'
    }
    
    if (stepIndex < currentIndex) {
      return 'completed'
    } else if (stepIndex === currentIndex) {
      return 'active'
    }
    return 'pending'
  }

  const handleReorder = async () => {
    if (!order) return
    
    setIsReordering(true)
    setReorderMessage(null)
    
    try {
      const response = await fetch(`/api/orders/${order.id}/reorder`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'রি-অর্ডার করতে সমস্যা হয়েছে')
      }
      
      if (data.addedItems && data.addedItems.length > 0) {
        setReorderMessage({
          type: 'success',
          text: data.message,
        })
        setTimeout(() => {
          router.push('/cart')
        }, 1500)
      } else {
        setReorderMessage({
          type: 'error',
          text: data.message || 'কোনো পণ্য কার্টে যোগ করা যায়নি',
        })
      }
    } catch (err) {
      setReorderMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'রি-অর্ডার করতে সমস্যা হয়েছে',
      })
    } finally {
      setIsReordering(false)
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-lg text-red-600">{error || 'Order not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 rounded-lg bg-teal-600 px-6 py-2 text-white hover:bg-teal-700"
        >
          Go Home
        </button>
      </div>
    )
  }

  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Green Header */}
      <div className="bg-[#00A651] px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-full p-1 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {settings?.headerTitlePrefixBn || 'অর্ডার'} #{order.orderNumber}
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status Timeline Card */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {settings?.statusSectionTitleBn || 'স্ট্যাটাস'}
          </h2>

          {/* Cancelled Status */}
          {isCancelled && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center">
              <p className="font-semibold text-red-600">
                {settings?.cancelledLabelBn || 'বাতিল'}
              </p>
            </div>
          )}

          {/* Vertical Stepper */}
          {!isCancelled && (
            <div className="relative pl-8">
              {STATUS_ORDER.map((status, index) => {
                const state = getStepState(status)
                const time = getStatusTime(status)
                const isLast = index === STATUS_ORDER.length - 1

                return (
                  <div key={status} className="relative pb-6 last:pb-0">
                    {/* Vertical Line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[-20px] top-6 h-full w-0.5 ${
                          state === 'completed' ? 'bg-[#00A651]' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Circle Icon */}
                    <div className="absolute left-[-28px] top-0">
                      {state === 'completed' ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#00A651]">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      ) : state === 'active' ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#00A651] bg-white">
                          <div className="h-2 w-2 rounded-full bg-[#00A651]" />
                        </div>
                      ) : (
                        <Circle className="h-4 w-4 text-gray-300" />
                      )}
                    </div>

                    {/* Status Content */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            state === 'completed' || state === 'active'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {getStatusLabel(status)}
                        </p>
                        {/* Show rider info for SHIPPED status */}
                        {status === 'SHIPPED' && state !== 'pending' && order.riderName && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {settings?.riderLabelBn || 'রাইডার:'} {order.riderName}
                            </span>
                            {order.riderPhone && (
                              <a
                                href={`tel:${order.riderPhone}`}
                                className="flex items-center gap-1 rounded-full bg-[#00A651] px-2 py-0.5 text-xs text-white"
                              >
                                <Phone className="h-3 w-3" />
                                {settings?.callButtonBn || 'Call'}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {time && (state === 'completed' || state === 'active') && (
                        <span className="text-xs text-gray-500">{time}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Estimated Delivery */}
          {order.estimatedDeliveryText && !isCancelled && order.status !== 'DELIVERED' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50 p-3">
              <Clock className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-teal-700">
                {settings?.estimatedDeliveryLabelBn || 'আনুমানিক সময়:'} {order.estimatedDeliveryText}
              </span>
            </div>
          )}
        </div>

        {/* Delivery Address Card */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            {settings?.deliverySectionTitleBn || 'ডেলিভারি ঠিকানা'}
          </h2>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.address.fullName}</p>
              <p>{order.address.addressLine1}</p>
              {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
              <p>{order.address.city}, {order.address.zone.name}</p>
              <p className="mt-1">{order.address.phone}</p>
            </div>
          </div>
        </div>

        {/* Order Items Card */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            {settings?.itemsSectionTitleBn || 'আইটেমস'} ({order.items.length})
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => {
              const itemData = item.medicine || item.product
              const imageUrl = itemData?.imageUrl || '/placeholder-medicine.png'
              const name = itemData?.name || 'Unknown Item'
              const unit = itemData?.unit || 'pcs'

              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} {unit} x ৳{item.price.toFixed(0)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ৳{item.total.toFixed(0)}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">৳{order.subtotal.toFixed(0)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600">-৳{order.discount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>
              <span className="text-gray-900">৳{order.deliveryCharge.toFixed(0)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
              <span className="text-gray-900">{settings?.totalLabelBn || 'সর্বমোট:'}</span>
              <span className="text-[#00A651]">৳{order.total.toFixed(0)}</span>
            </div>
          </div>

          {/* Re-order Button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {reorderMessage && (
              <div className={`mb-3 p-3 rounded-lg text-sm ${
                reorderMessage.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {reorderMessage.text}
              </div>
            )}
            <button
              onClick={handleReorder}
              disabled={isReordering}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00A651] text-white rounded-xl font-medium hover:bg-[#008f45] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isReordering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  রি-অর্ডার হচ্ছে...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  আবার অর্ডার করুন
                </>
              )}
            </button>
          </div>
        </div>

        {/* Support Footer */}
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">
            {settings?.supportTextBn || 'সাহায্য প্রয়োজন?'}{' '}
            <a
              href={`tel:${settings?.supportPhone || '01700000000'}`}
              className="font-semibold text-[#00A651]"
            >
              {settings?.supportLinkTextBn || 'কল করুন'}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
