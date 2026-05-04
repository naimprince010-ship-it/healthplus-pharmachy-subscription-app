'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useCart, type CartItem } from '@/contexts/CartContext'

const CHECKOUT_GREEN = '#0F6E56'

function formatBnInteger(n: number) {
  return Math.round(n).toLocaleString('bn-BD')
}

function formatPriceBn(n: number) {
  return `৳ ${formatBnInteger(n)}`
}

/** Thumb + pill colors aligned with shopping_cart_redesign.html */
function categoryVisuals(category: string | undefined, type: CartItem['type']) {
  const raw = `${category ?? ''}`.toLowerCase()
  if (type === 'MEDICINE' || /ওষুধ|medicine|tablet|syrup|ক্যাপসুল|ইনহেলার/.test(raw)) {
    return { pill: 'bg-[#E6F1FB] text-[#185FA5]', thumb: 'bg-[#E6F1FB]' }
  }
  if (/খাদ্য|grocery|food|ডেইরি|মসলা|তেল|চাল|ডাল/.test(raw)) {
    return { pill: 'bg-[#FAEEDA] text-[#854F0B]', thumb: 'bg-[#FAEEDA]' }
  }
  if (/স্বাস্থ্য|hygiene|personal|প্যাড|প্যান্টি|কেয়ার|beauty|বিউটি/.test(raw)) {
    return { pill: 'bg-[#FBEAF0] text-[#72243E]', thumb: 'bg-[#FBEAF0]' }
  }
  return { pill: 'bg-slate-100 text-slate-600', thumb: 'bg-slate-100' }
}

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    isDrawerOpen,
    closeDrawer,
  } = useCart()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
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

  const mrpTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.mrp ?? item.price) * item.quantity, 0),
    [items]
  )
  const totalSavings = mrpTotal - total

  const getProductLink = (item: (typeof items)[0]) => {
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
      aria-labelledby="cart-drawer-title"
    >
      <div
        className={`flex h-full w-full max-w-[420px] flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — redesign */}
        <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E1F5EE]"
              aria-hidden
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CHECKOUT_GREEN} strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <span id="cart-drawer-title" className="truncate text-[15px] font-medium text-gray-900">
              আপনার কার্ট
            </span>
            {items.length > 0 && (
              <span className="shrink-0 rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-medium text-[#0F6E56]">
                {itemCount.toLocaleString('bn-BD')} টি পণ্য
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="cursor-pointer p-1 text-lg leading-none text-gray-500 hover:text-gray-800"
            aria-label="কার্ট বন্ধ করুন"
          >
            ×
          </button>
        </div>

        {/* Line items */}
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-gray-500">
              <svg className="mb-4 h-16 w-16 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700">আপনার কার্ট খালি</p>
              <p className="mt-1 text-sm">পণ্য যোগ করুন</p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-6 rounded-lg px-6 py-2.5 text-[15px] font-medium text-white transition-colors"
                style={{ backgroundColor: CHECKOUT_GREEN }}
              >
                কেনাকাটা করুন
              </button>
            </div>
          ) : (
            items.map((item, index) => {
              const itemId = item.medicineId || item.productId || item.membershipPlanId || item.id
              const productLink = getProductLink(item)
              const { pill, thumb } = categoryVisuals(item.category, item.type)
              const isLast = index === items.length - 1

              const thumbInner = item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={52}
                  height={52}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-semibold text-gray-600/80" aria-hidden>
                  {(item.name?.trim()?.charAt(0) ?? '?').toUpperCase()}
                </span>
              )

              const titleEl = productLink ? (
                <Link
                  href={productLink}
                  onClick={closeDrawer}
                  className="block truncate text-[13px] font-medium text-gray-900 hover:text-[#0F6E56]"
                >
                  {item.name}
                </Link>
              ) : (
                <p className="truncate text-[13px] font-medium text-gray-900">{item.name}</p>
              )

              return (
                <div
                  key={itemId}
                  className={`flex items-center gap-3 px-5 py-3 ${!isLast ? 'border-b border-gray-200/80' : ''}`}
                >
                  {productLink ? (
                    <Link
                      href={productLink}
                      onClick={closeDrawer}
                      className={`relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] ${thumb}`}
                    >
                      {thumbInner}
                    </Link>
                  ) : (
                    <div
                      className={`relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] ${thumb}`}
                    >
                      {thumbInner}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {titleEl}
                    {item.category ? (
                      <span className={`mt-0.5 inline-block rounded-full px-1.5 py-px text-[10px] font-medium ${pill}`}>
                        {item.category}
                      </span>
                    ) : null}
                    <p className="mt-1 text-[14px] font-medium" style={{ color: CHECKOUT_GREEN }}>
                      {formatPriceBn(item.price)}
                    </p>
                  </div>

                  <div className="flex h-7 shrink-0 items-stretch overflow-hidden rounded-md border border-gray-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(itemId, item.quantity - 1)}
                      className="flex w-7 items-center justify-center bg-gray-50 text-sm text-gray-900 hover:bg-gray-100"
                      aria-label="পরিমাণ কমান"
                    >
                      −
                    </button>
                    <span className="flex w-7 items-center justify-center text-[13px] font-medium text-gray-900">
                      {item.quantity.toLocaleString('bn-BD')}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(itemId, item.quantity + 1)}
                      className="flex w-7 items-center justify-center bg-gray-50 text-sm text-gray-900 hover:bg-gray-100"
                      aria-label="পরিমাণ বাড়ান"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200/80 bg-gray-50 px-5 py-3.5">
            <div className="mb-1.5 flex justify-between text-[13px] text-gray-600">
              <span>মোট এম.আর.পি মূল্য</span>
              <span>{formatPriceBn(mrpTotal)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="mb-2 flex justify-between text-xs text-[#0F6E56]">
                <span>ডিসকাউন্টে বাঁচলেন</span>
                <span>{formatPriceBn(totalSavings)}</span>
              </div>
            )}
            <div className="mb-3.5 flex justify-between text-[14px] font-medium text-gray-900">
              <span>সর্বমোট মূল্য</span>
              <span className="text-base font-medium" style={{ color: CHECKOUT_GREEN }}>
                {formatPriceBn(total)}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="flex w-full items-center justify-center rounded-lg py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-95"
              style={{ backgroundColor: CHECKOUT_GREEN }}
            >
              চেকআউট করুন ↗
            </Link>

            <div className="mt-2 flex flex-col gap-2 text-center">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="cursor-pointer text-center text-[12px] font-normal text-[#1D9E75] hover:underline"
              >
                পুরো কার্ট দেখুন
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearCart()
                }}
                className="cursor-pointer text-xs text-gray-400 hover:text-red-600"
              >
                কার্ট খালি করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
