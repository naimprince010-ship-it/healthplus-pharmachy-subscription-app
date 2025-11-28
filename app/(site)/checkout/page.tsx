'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Tag } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { trackBeginCheckout, trackPurchase, type GA4Item } from '@/lib/trackEvent'

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

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
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

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin?redirect=/checkout')
      return
    }

    if (items.length === 0) {
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
        }
      })
      .catch((err) => console.error('Failed to fetch zones:', err))
  }, [session, items, router, total])

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
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMethod: 'COD',
          notes,
          addressId: selectedAddress,
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

      clearCart()
      router.push(`/orders/${data.order.id}`)
    } catch (err) {
      console.error('Checkout error:', err)
      setError('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
      setIsLoading(false)
    }
  }

  const selectedZoneData = zones.find((z) => z.id === selectedZone)
  const deliveryCharge = selectedZoneData?.deliveryCharge || 0
  
  const mrpTotal = items.reduce((sum, item) => {
    const mrp = item.mrp || item.price
    return sum + mrp * item.quantity
  }, 0)
  
  const savings = mrpTotal - total - couponDiscount
  const grandTotal = total + deliveryCharge - couponDiscount

  if (!session || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-6 lg:px-8">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Delivery Info */}
            <div className="flex-1 space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Section 1: Delivery Address */}
              <div className="rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white font-semibold text-sm">
                    1
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">ডেলিভারি ঠিকানা</h2>
                </div>
                
                <div className="p-4">
                  {/* Zone Selection */}
                  <div className="mb-4">
                    <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-2">
                      ডেলিভারি জোন নির্বাচন করুন *
                    </label>
                    <select
                      id="zone"
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      required
                      className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">জোন নির্বাচন করুন</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} - ৳{zone.deliveryCharge} ডেলিভারি
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Address Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                        <span className="text-red-500 font-medium">No address found</span>
                      </div>
                    ) : (
                      addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr.id)}
                          className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                            selectedAddress === addr.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-semibold text-gray-900">{addr.label}</p>
                          <p className="text-sm text-gray-600 mt-1">{addr.fullAddress}</p>
                          <p className="text-sm text-gray-600">{addr.phone}</p>
                        </div>
                      ))
                    )}

                    {/* Add Address Button */}
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(true)}
                      className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-teal-400 p-6 text-teal-600 hover:bg-teal-50 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="font-medium">ঠিকানা যোগ করুন</span>
                    </button>
                  </div>

                  {/* Add Address Form */}
                  {showAddAddress && (
                    <div className="mt-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3">নতুন ঠিকানা যোগ করুন</h3>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="ঠিকানার নাম (যেমন: বাসা, অফিস)"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-teal-500 focus:outline-none"
                        />
                        <textarea
                          placeholder="সম্পূর্ণ ঠিকানা"
                          value={newAddress.fullAddress}
                          onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                          rows={2}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-teal-500 focus:outline-none"
                        />
                        <input
                          type="tel"
                          placeholder="ফোন নম্বর"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-teal-500 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddAddress}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            সংরক্ষণ করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddAddress(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            বাতিল
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Instructions */}
              <div className="rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white font-semibold text-sm">
                    2
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">নির্দেশাবলী (ঐচ্ছিক)</h2>
                </div>
                
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    অতিরিক্ত নির্দেশনা
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                    placeholder="ডেলিভারির জন্য কোনো বিশেষ নির্দেশনা থাকলে লিখুন..."
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:w-96">
              <div className="rounded-lg bg-white shadow-sm border border-gray-200 sticky top-4">
                {/* Products Header */}
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">পণ্য</h2>
                </div>

                {/* Product List */}
                <div className="max-h-80 overflow-y-auto">
                  {items.map((item) => {
                    const itemId = item.medicineId || item.productId || item.id
                    const mrp = item.mrp || item.price
                    const hasDiscount = mrp > item.price
                    const productLink = item.slug 
                      ? (item.type === 'MEDICINE' ? `/medicines/${item.slug}` : `/products/${item.slug}`)
                      : null

                    return (
                      <div key={itemId} className="flex gap-3 p-4 border-b border-gray-100 last:border-b-0">
                        {/* Product Image */}
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          {productLink ? (
                            <Link href={productLink} className="text-sm font-medium text-gray-900 hover:text-teal-600 line-clamp-2">
                              {item.name}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                          )}
                          {item.category && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                          )}
                          <p className="text-xs text-gray-500">{item.quantity} টি</p>
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
                <div className="p-4 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">মোট এম.আর.পি মূল্য</span>
                    <span className="text-gray-900">৳ {mrpTotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ডেলিভারি ফি</span>
                    <span className="text-gray-900">৳ {deliveryCharge.toFixed(0)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ছাড়</span>
                      <span className="text-green-600">- ৳ {savings.toFixed(0)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Section */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <Tag className="h-5 w-5" />
                    <span>Apply a coupon</span>
                  </button>
                  {!couponApplied && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="কুপন কোড"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        প্রয়োগ
                      </button>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-900">মোট</span>
                    <span className="text-gray-900">৳ {grandTotal.toFixed(0)}</span>
                  </div>
                </div>

                {/* Order Button */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-sky-500 py-3 font-semibold text-white hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'অর্ডার করা হচ্ছে...' : 'অর্ডার করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
