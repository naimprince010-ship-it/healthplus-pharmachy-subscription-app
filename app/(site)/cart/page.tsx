'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useSession } from 'next-auth/react'
import { Trash2, Plus, Minus, X, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MAIN_CONTAINER } from '@/lib/layout'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount, isInitialized } = useCart()
  const { data: session, status } = useSession()
  const router = useRouter()

  // Hide footer on mobile for cart page
  useEffect(() => {
    const footer = document.querySelector('footer')
    if (footer) {
      footer.classList.add('hidden', 'lg:block')
    }
    return () => {
      if (footer) {
        footer.classList.remove('hidden', 'lg:block')
      }
    }
  }, [])

  // Gate content behind readiness check to avoid hydration mismatch
  // Server and first client render both show loading state, then cart loads after mount
  const isReady = isInitialized && status !== 'loading'

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile header skeleton */}
        <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        {/* Loading skeleton */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex gap-4">
                  <div className="h-20 w-20 animate-pulse rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const hasMembership = false

  const discount = hasMembership ? total * 0.1 : 0
  const subtotal = total - discount

  // Calculate MRP total (sum of mrp * quantity for items with mrp, otherwise use price)
  const mrpTotal = items.reduce((sum, item) => {
    const mrp = item.mrp || item.price
    return sum + mrp * item.quantity
  }, 0)

  // Calculate total savings
  const totalSavings = mrpTotal - subtotal

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile header with back button */}
        <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">কার্ট</h1>
        </div>

        <div className="py-16 lg:py-16">
          <div className={MAIN_CONTAINER}>
            <h1 className="hidden text-3xl font-bold text-gray-900 lg:block">Shopping Cart</h1>

            <div className="mt-0 lg:mt-8">
              <div className="rounded-lg bg-white p-12 text-center shadow">
                <div className="mx-auto mb-4 h-24 w-24 text-gray-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                </div>
                <p className="text-lg text-gray-600">আপনার কার্ট খালি</p>
                <p className="mt-1 text-sm text-gray-500">পণ্য যোগ করুন শপিং শুরু করতে</p>
                <Link
                  href="/"
                  className="mt-6 inline-block rounded-lg bg-teal-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  শপিং শুরু করুন
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header with back button */}
      <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">কার্ট ({itemCount})</h1>
      </div>

      {/* Main cart content - pb-52 (208px) accounts for checkout bar height (~150px) + extra spacing */}
      <div className="py-6 pb-52 lg:py-8 lg:pb-8">
        <div className={MAIN_CONTAINER}>
          {/* Header with item count and clear all - Desktop only */}
          <div className="hidden items-center justify-between lg:flex">
            <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">
              {itemCount} টি পণ্য
            </h1>
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              সব মুছুন
            </button>
          </div>
          
          {/* Mobile clear all button */}
          <div className="flex justify-end lg:hidden">
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              সব মুছুন
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => {
                  const itemId = item.medicineId || item.productId || ''
                  const hasDiscount = item.mrp && item.mrp > item.price
                  const itemTotal = item.price * item.quantity
                  const mrpItemTotal = (item.mrp || item.price) * item.quantity

                  return (
                    <div key={itemId} className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <h3 className="font-semibold text-gray-900 line-clamp-2">{item.name}</h3>
                              {item.genericName && (
                                <p className="mt-0.5 text-sm text-teal-600">{item.genericName}</p>
                              )}
                              {item.category && (
                                <p className="mt-0.5 text-xs text-gray-500">{item.category}</p>
                              )}
                            </div>
                            {/* Remove button */}
                            <button
                              onClick={() => removeItem(itemId)}
                              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                              aria-label="Remove item"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Price and Quantity */}
                          <div className="mt-3 flex items-end justify-between">
                            {/* Price */}
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-gray-900">৳ {itemTotal.toFixed(0)}</span>
                                {hasDiscount && (
                                  <span className="text-sm text-gray-400 line-through">৳{mrpItemTotal.toFixed(0)}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">৳{item.price.toFixed(0)} / পিস</p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white">
                              <button
                                onClick={() => updateQuantity(itemId, item.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(itemId, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary - Desktop only */}
            <div className="hidden lg:col-span-1 lg:block">
              <div className="sticky top-4 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">অর্ডার সারাংশ</h2>
                
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">মোট এম.আর.পি মূল্য:</span>
                    <span className="font-medium text-gray-900">৳ {mrpTotal.toFixed(0)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">সর্বমোট মূল্য:</span>
                    <span className="font-bold text-gray-900">৳ {subtotal.toFixed(0)}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">মোট টাকা বাঁচলো:</span>
                      <span className="font-semibold text-green-600">৳ {totalSavings.toFixed(0)}</span>
                    </div>
                  )}

                  {hasMembership && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">মেম্বারশিপ ডিস্কাউন্ট (10%)</span>
                      <span className="font-semibold text-green-600">-৳{discount.toFixed(0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ডেলিভারি চার্জ:</span>
                    <span className="text-gray-500">চেকআউটে দেখুন</span>
                  </div>
                </div>

                <div className="mt-6">
                  {!session ? (
                    <Link
                      href="/auth/signin?redirect=/cart"
                      className="block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white hover:bg-teal-700"
                    >
                      সাইন ইন করুন
                    </Link>
                  ) : (
                    <Link
                      href="/checkout"
                      className="block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white hover:bg-teal-700"
                    >
                      চেকআউট
                    </Link>
                  )}
                </div>

                {!hasMembership && session && (
                  <div className="mt-4 rounded-lg bg-teal-50 p-4">
                    <p className="text-sm text-teal-900">
                      মেম্বারশিপ নিয়ে সব ওষুধে 10% ছাড় পান!
                    </p>
                    <Link
                      href="/membership"
                      className="mt-2 inline-block text-sm font-semibold text-teal-600 hover:text-teal-700"
                    >
                      আরও জানুন →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar - positioned at bottom-0 since SiteMobileNav is hidden on cart page */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Summary row */}
        <div className="border-b border-gray-100 px-4 py-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">মোট এম.আর.পি:</span>
            <span className="text-gray-500">৳ {mrpTotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-900">সর্বমোট:</span>
            <span className="font-bold text-gray-900">৳ {subtotal.toFixed(0)}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">বাঁচলো:</span>
              <span className="font-semibold text-green-600">৳ {totalSavings.toFixed(0)}</span>
            </div>
          )}
        </div>
        
        {/* Checkout button */}
        <div className="px-4 py-3">
          {!session ? (
            <Link
              href="/auth/signin?redirect=/cart"
              className="block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white hover:bg-teal-700"
            >
              সাইন ইন করুন
            </Link>
          ) : (
            <Link
              href="/checkout"
              className="block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white hover:bg-teal-700"
            >
              চেকআউট
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
