'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

export function CartDrawer() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    total, 
    itemCount,
    isDrawerOpen,
    closeDrawer 
  } = useCart()

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer()
      }
    }
    if (isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen, closeDrawer])

  // Calculate MRP total
  const mrpTotal = items.reduce((sum, item) => {
    const mrp = item.mrp || item.price
    return sum + mrp * item.quantity
  }, 0)

  // Calculate savings
  const totalSavings = mrpTotal - total

  // Get product link
  const getProductLink = (item: typeof items[0]) => {
    if (!item.slug) return null
    return item.type === 'MEDICINE' ? `/medicines/${item.slug}` : `/products/${item.slug}`
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-200 ${
        isDrawerOpen ? 'bg-black/40 opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={closeDrawer}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{itemCount} টি পণ্য</h2>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium">আপনার কার্ট খালি</p>
              <p className="text-sm mt-1">পণ্য যোগ করুন</p>
              <button
                onClick={closeDrawer}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                কেনাকাটা করুন
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                const itemId = item.medicineId || item.productId || item.id
                const productLink = getProductLink(item)
                const mrp = item.mrp || item.price
                const hasDiscount = mrp > item.price

                return (
                  <div key={itemId} className="p-4">
                    <div className="flex gap-3">
                      {/* Product Image - Clickable */}
                      {productLink ? (
                        <Link href={productLink} onClick={closeDrawer} className="flex-shrink-0">
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
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
                        </Link>
                      ) : (
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {/* Product Name - Clickable */}
                            {productLink ? (
                              <Link 
                                href={productLink} 
                                onClick={closeDrawer}
                                className="text-sm font-medium text-gray-900 hover:text-teal-600 line-clamp-2 transition-colors"
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                {item.name}
                              </h3>
                            )}
                            {/* Category */}
                            {item.category && (
                              <p className="text-xs text-teal-600 mt-0.5">{item.category}</p>
                            )}
                          </div>
                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(itemId)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            aria-label="Remove item"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Price and Quantity */}
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-sm font-semibold text-gray-900">৳ {item.price}</span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through ml-1">৳{mrp}</span>
                            )}
                          </div>
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity - 1)}
                              className="p-1.5 hover:bg-gray-100 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity + 1)}
                              className="p-1.5 hover:bg-gray-100 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with Totals */}
        {items.length > 0 && (
          <div className="border-t bg-white p-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">মোট এম.আর.পি মূল্য:</span>
                <span className="text-gray-500">৳ {mrpTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>সর্বমোট মূল্য:</span>
                <span>৳ {total.toFixed(0)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>মোট টাকা বাঁচলো:</span>
                  <span>৳ {totalSavings.toFixed(0)}</span>
                </div>
              )}
            </div>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="block w-full py-3 bg-teal-600 text-white text-center font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              চেকআউট
            </Link>
            <Link
              href="/cart"
              onClick={closeDrawer}
              className="block w-full py-2 mt-2 text-center text-sm text-teal-600 hover:underline"
            >
              পুরো কার্ট দেখুন
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
