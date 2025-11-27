'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useSession } from 'next-auth/react'
import { Trash2, Plus, Minus, MessageCircle } from 'lucide-react'
import { trackWhatsAppClick } from '@/lib/trackEvent'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart()
  const { data: session } = useSession()

  const hasMembership = false

  const discount = hasMembership ? total * 0.1 : 0
  const subtotal = total - discount

  // Correct items vs units count
  const itemCount = items.length // unique products
  const unitCount = items.reduce((sum, item) => sum + item.quantity, 0) // total quantity

  const handleWhatsAppClick = () => {
    trackWhatsAppClick('cart_floating_button')
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8801XXXXXXXXX'
    const message = encodeURIComponent('Hello! I need help with my cart.')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Shopping Cart</h1>

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
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Cart Header */}
      <header className="bg-gray-50 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-bold text-gray-900 lg:text-3xl">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'} · {unitCount} {unitCount === 1 ? 'unit' : 'units'})
          </h1>
        </div>
      </header>

      {/* Cart Items - Scrollable area */}
      <div 
        className="flex-1 overflow-y-auto px-4 pb-[calc(var(--bottom-bar-height)+env(safe-area-inset-bottom,0px)+16px)] pt-4 sm:px-6 lg:overflow-visible lg:pb-8 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart items list */}
            <div className="lg:col-span-2">
              <div className="space-y-4 pr-16 lg:pr-0">
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
                    <span className="text-gray-600">Subtotal ({unitCount} units)</span>
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

      {/* Mobile sticky checkout bar - fixed at bottom */}
      <div 
        className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-gray-200 bg-white px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Total</span>
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

      {/* Floating chat widget (medeasy-style) - Mobile only */}
      <div 
        className="fixed right-4 z-40 flex flex-col items-end gap-2 lg:hidden"
        style={{ bottom: 'calc(var(--bottom-bar-height) + 24px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={handleWhatsAppClick}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-transform hover:scale-110"
            aria-label="Chat on WhatsApp"
          >
            <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
        </div>
        <button 
          className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-transform hover:scale-110"
          aria-label="Need help?"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      </div>
    </div>
  )
}
