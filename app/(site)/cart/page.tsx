'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useSession } from 'next-auth/react'
import { Trash2, Plus, Minus } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart()
  const { data: session } = useSession()

  const hasMembership = false

  const discount = hasMembership ? total * 0.1 : 0
  const subtotal = total - discount

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>

          <div className="mt-8">
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <p className="text-gray-600">Your cart is empty</p>
              <Link
                href="/medicines"
                className="mt-4 inline-block rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main cart content */}
      <div className="bg-gray-50 py-8 pb-44 lg:py-16 lg:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Shopping Cart ({itemCount} items)</h1>

          <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-3">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => {
                  const itemId = item.medicineId || item.productId || ''
                  return (
                    <div key={itemId} className="rounded-lg bg-white p-4 shadow lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 lg:text-lg">{item.name}</h3>
                          <p className="mt-1 text-sm text-gray-600">৳{item.price} per unit</p>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity - 1)}
                              className="rounded-md bg-gray-100 p-1 hover:bg-gray-200"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-semibold lg:w-12">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity + 1)}
                              className="rounded-md bg-gray-100 p-1 hover:bg-gray-200"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="w-16 text-right lg:w-24">
                            <p className="font-semibold text-gray-900">৳{item.price * item.quantity}</p>
                          </div>

                          <button
                            onClick={() => removeItem(itemId)}
                            className="text-red-600 hover:text-red-700"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary - Desktop only */}
            <div className="hidden lg:col-span-1 lg:block">
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">৳{total}</span>
                  </div>
                  {hasMembership && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Membership Discount (10%)</span>
                      <span className="font-semibold text-green-600">-৳{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charge</span>
                    <span className="text-sm text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">৳{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {!session ? (
                  <div className="mt-6">
                    <Link
                      href="/auth/signin?redirect=/cart"
                      className="block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white hover:bg-teal-700"
                    >
                      Sign in to Checkout
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/checkout"
                    className="mt-6 block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white hover:bg-teal-700"
                  >
                    Proceed to Checkout
                  </Link>
                )}

                {!hasMembership && session && (
                  <div className="mt-4 rounded-lg bg-teal-50 p-4">
                    <p className="text-sm text-teal-900">
                      Get 10% off on all medicines with our membership!
                    </p>
                    <Link
                      href="/membership"
                      className="mt-2 inline-block text-sm font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Learn more →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-lg lg:hidden" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-lg font-bold text-gray-900">৳{subtotal.toFixed(2)}</p>
          </div>
          {!session ? (
            <Link
              href="/auth/signin?redirect=/cart"
              className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700"
            >
              Sign in to Checkout
            </Link>
          ) : (
            <Link
              href="/checkout"
              className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700"
            >
              Proceed to Checkout
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
