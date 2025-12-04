'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { ArrowLeft, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { trackBeginCheckout, trackPurchase, type GA4Item } from '@/lib/trackEvent'
import { MAIN_CONTAINER } from '@/lib/layout'

interface Zone {
  id: string
  name: string
  deliveryCharge: number
}

interface Address {
  id: string
  label: string
  fullAddress: string
  phone: string
}

interface CheckoutSettings {
  pageTitleBn: string
  addressSectionTitleBn: string
  addAddressButtonBn: string
  paymentSectionTitleBn: string
  codLabelBn: string
  bkashLabelBn: string
  couponSectionTitleBn: string
  couponPlaceholderBn: string
  couponApplyBn: string
  orderSummarySectionTitleBn: string
  viewDetailsBn: string
  totalLabelBn: string
  confirmButtonBn: string
}

const DEFAULT_SETTINGS: CheckoutSettings = {
  pageTitleBn: 'চেকআউট',
  addressSectionTitleBn: '১. ডেলিভারি ঠিকানা',
  addAddressButtonBn: 'নতুন ঠিকানা যোগ করুন',
  paymentSectionTitleBn: '২. পেমেন্ট মেথড',
  codLabelBn: 'ক্যাশ অন ডেলিভারি',
  bkashLabelBn: 'বিকাশ / নগদ',
  couponSectionTitleBn: '৩. কুপন কোড',
  couponPlaceholderBn: 'কুপন কোড লিখুন',
  couponApplyBn: 'Apply',
  orderSummarySectionTitleBn: '৪. অর্ডার সামারি',
  viewDetailsBn: 'বিস্তারিত দেখুন',
  totalLabelBn: 'সর্বমোট:',
  confirmButtonBn: 'অর্ডার কনফার্ম করুন',
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, total, clearCart } = useCart()
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ label: '', fullAddress: '', phone: '' })
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH'>('COD')
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(false)
    const [settings, setSettings] = useState<CheckoutSettings>(DEFAULT_SETTINGS)
    const [hasSubmittedOrder, setHasSubmittedOrder] = useState(false)
    const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | null>(null)

  useEffect(() => {
    // Wait until session has finished loading before checking auth
    if (status === 'loading') {
      return
    }

    // If no session after loading is done, redirect to signin
    if (!session) {
      router.push('/auth/signin?redirect=/checkout')
      return
    }

    // Only redirect to cart if cart is empty AND we haven't just submitted an order
    // This prevents the redirect race condition when clearCart() is called after order submission
    if (items.length === 0 && !hasSubmittedOrder) {
      router.push('/cart')
      return
    }

    const ga4Items: GA4Item[] = items.map((item) => ({
      item_id: item.medicineId || item.productId || '',
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    }))
    trackBeginCheckout(ga4Items, total)

    fetch('/api/zones')
      .then((res) => res.json())
      .then((data) => {
        if (data.zones) {
          setZones(data.zones)
          if (data.zones.length > 0) {
            setSelectedZone(data.zones[0].id)
          }
        }
      })
      .catch((err) => console.error('Failed to fetch zones:', err))

      fetch('/api/checkout/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
          }
        })
        .catch((err) => console.error('Failed to fetch checkout settings:', err))

      // Fetch cart settings to get free delivery threshold
      fetch('/api/cart/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings?.freeDeliveryThreshold) {
            setFreeDeliveryThreshold(data.settings.freeDeliveryThreshold)
          }
        })
        .catch((err) => console.error('Failed to fetch cart settings:', err))
    }, [status, session, items, router, total, hasSubmittedOrder])

  const handleAddAddress = () => {
    if (!newAddress.label || !newAddress.fullAddress || !newAddress.phone) return
    const newAddr: Address = {
      id: Date.now().toString(),
      ...newAddress,
    }
    setAddresses([...addresses, newAddr])
    setSelectedAddress(newAddr.id)
    setShowAddAddress(false)
    setNewAddress({ label: '', fullAddress: '', phone: '' })
  }

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return
    setCouponApplied(true)
    setCouponDiscount(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!selectedZone) {
      setError('অনুগ্রহ করে ডেলিভারি জোন নির্বাচন করুন')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
                  body: JSON.stringify({
                    zoneId: selectedZone,
                    items: items.map((item) => ({
                      medicineId: item.medicineId,
                      productId: item.productId,
                      membershipPlanId: item.membershipPlanId,
                      quantity: item.quantity,
                      price: item.price,
                    })),
                    paymentMethod,
                    notes,
                  }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'অর্ডার তৈরি করতে ব্যর্থ হয়েছে')
        setIsLoading(false)
        return
      }

      const ga4Items: GA4Item[] = items.map((item) => ({
        item_id: item.medicineId || item.productId || '',
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))

      trackPurchase({
        transaction_id: data.order.id,
        value: grandTotal,
        shipping: deliveryCharge,
        items: ga4Items,
      })

      // Set flag BEFORE clearing cart to prevent the useEffect from redirecting to /cart
      // when it sees items.length === 0 after clearCart() is called
      setHasSubmittedOrder(true)
      clearCart()
      // Redirect to order success page with order details
      // Use replace to prevent going back to checkout
      router.replace(`/order-success?orderId=${data.order.id}&amount=${grandTotal}&paymentMethod=${paymentMethod}`)
    } catch (err) {
      console.error('Checkout error:', err)
      setError('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
      setIsLoading(false)
    }
  }

    const selectedZoneData = zones.find((z) => z.id === selectedZone)
    // Apply free delivery if cart total meets the threshold
    const qualifiesForFreeDelivery = freeDeliveryThreshold !== null && total >= freeDeliveryThreshold
    const deliveryCharge = qualifiesForFreeDelivery ? 0 : (selectedZoneData?.deliveryCharge || 0)
  
  const mrpTotal = items.reduce((sum, item) => {
    const mrp = item.mrp || item.price
    return sum + mrp * item.quantity
  }, 0)
  
    const savings = mrpTotal - total - couponDiscount
    const grandTotal = total + deliveryCharge - couponDiscount
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    // Show loading state while session is being fetched
    if (status === 'loading') {
      return (
        <div className="min-h-screen bg-gray-100">
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="px-4 py-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
                <div className="h-12 w-full bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (!session || items.length === 0) {
      return null
    }

    const selectedAddressData = addresses.find(a => a.id === selectedAddress)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header - Simple with back arrow */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{settings.pageTitleBn}</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className={`${MAIN_CONTAINER} py-4`}>
          <h1 className="text-2xl font-bold text-gray-900">{settings.pageTitleBn}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main Content - with bottom padding for sticky footer */}
        <div className="px-4 py-4 pb-32 lg:pb-8 space-y-4 lg:max-w-4xl lg:mx-auto">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Section 1: Delivery Address */}
          <div className="bg-white rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{settings.addressSectionTitleBn}</h2>
            
            {/* Zone Selection */}
            <div className="mb-4">
              <select
                id="zone"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                required
                className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="">জোন নির্বাচন করুন</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} - ৳{zone.deliveryCharge} ডেলিভারি
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Address Card with Radio */}
            {addresses.length > 0 && selectedAddressData && (
              <div className="mb-3">
                <div className="flex items-start gap-3 rounded-lg border-2 border-teal-500 bg-teal-50/30 p-4 cursor-pointer">
                  <div className="mt-0.5">
                    <div className="h-5 w-5 rounded-full border-2 border-teal-500 flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{selectedAddressData.fullAddress}</p>
                    <button type="button" className="text-teal-600 font-medium text-sm">[সম্পাদনা]</button>
                  </div>
                </div>
              </div>
            )}

            {/* Other addresses */}
            {addresses.filter(a => a.id !== selectedAddress).map((addr) => (
              <div
                key={addr.id}
                className="mb-3 flex items-start gap-3 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-gray-300"
                onClick={() => setSelectedAddress(addr.id)}
              >
                <div className="mt-0.5">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{addr.fullAddress}</p>
                </div>
              </div>
            ))}

            {/* Add New Address Button */}
            {!showAddAddress ? (
              <button
                type="button"
                onClick={() => setShowAddAddress(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-teal-400 py-3 text-teal-600 font-medium hover:bg-teal-50 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>{settings.addAddressButtonBn}</span>
              </button>
            ) : (
              <div className="rounded-lg border-2 border-gray-200 p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">নতুন ঠিকানা যোগ করুন</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="ঠিকানার নাম (যেমন: বাসা, অফিস)"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <textarea
                    placeholder="সম্পূর্ণ ঠিকানা"
                    value={newAddress.fullAddress}
                    onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                    rows={2}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="ফোন নম্বর"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                    >
                      সংরক্ষণ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{settings.paymentSectionTitleBn}</h2>
            
            <div className="flex items-center gap-6">
              {/* Cash on Delivery */}
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => setPaymentMethod('COD')}>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-teal-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'COD' && <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />}
                </div>
                <span className="text-gray-900">{settings.codLabelBn}</span>
              </label>

              {/* Bkash / Nagad */}
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => setPaymentMethod('BKASH')}>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'BKASH' ? 'border-teal-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'BKASH' && <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />}
                </div>
                <span className="text-gray-900">{settings.bkashLabelBn}</span>
              </label>
            </div>
          </div>

          {/* Section 3: Coupon Code */}
          <div className="bg-white rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{settings.couponSectionTitleBn}</h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={settings.couponPlaceholderBn}
                className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-6 py-3 bg-white border-2 border-teal-500 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
              >
                {settings.couponApplyBn}
              </button>
            </div>
            {couponApplied && couponDiscount === 0 && (
              <p className="mt-2 text-sm text-red-500">কুপন কোড সঠিক নয়</p>
            )}
          </div>

          {/* Section 4: Order Summary (Collapsible) */}
          <div className="bg-white rounded-xl">
            <button
              type="button"
              onClick={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
              className="w-full flex items-center justify-between p-4"
            >
              <h2 className="text-lg font-bold text-gray-900">{settings.orderSummarySectionTitleBn} ({itemCount}টি আইটেম)</h2>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900">৳ {total.toFixed(0)}</span>
                {orderSummaryExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* View Details Link */}
            <div className="px-4 pb-2">
              <button
                type="button"
                onClick={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
                className="flex items-center gap-1 text-teal-600 font-medium"
              >
                {orderSummaryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span>{settings.viewDetailsBn}</span>
              </button>
            </div>

            {/* Expanded Product List */}
            {orderSummaryExpanded && (
              <div className="border-t border-gray-100">
                <div className="max-h-80 overflow-y-auto">
                  {items.map((item) => {
                    const itemId = item.medicineId || item.productId || item.id
                    const mrp = item.mrp || item.price
                    const hasDiscount = mrp > item.price

                    return (
                      <div key={itemId} className="flex gap-3 p-4 border-b border-gray-100 last:border-b-0">
                        {/* Product Image */}
                        <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.quantity} টি</p>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">৳ {(item.price * item.quantity).toFixed(0)}</p>
                          {hasDiscount && (
                            <p className="text-xs text-gray-400 line-through">৳ {(mrp * item.quantity).toFixed(0)}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">সাবটোটাল</span>
                    <span className="text-gray-900">৳ {total.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ডেলিভারি ফি</span>
                    <span className="text-gray-900">৳ {deliveryCharge.toFixed(0)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">সেভিংস</span>
                      <span className="text-green-600">- ৳ {savings.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Order Button */}
          <div className="hidden lg:block">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-[#00A651] py-4 font-semibold text-white text-lg hover:bg-[#008f45] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'অর্ডার করা হচ্ছে...' : settings.confirmButtonBn}
            </button>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a1a2e] lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-white text-lg font-bold">{settings.totalLabelBn} ৳ {grandTotal.toFixed(0)}</span>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-[#00A651] text-white font-semibold rounded-full hover:bg-[#008f45] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'অপেক্ষা করুন...' : settings.confirmButtonBn}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
