'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, ShoppingBag, Truck, Gift, Zap } from 'lucide-react'
import { useCart, type CartItem } from '@/contexts/CartContext'
import { AddToCartButton } from '@/components/AddToCartButton'

const CHECKOUT_GREEN = '#0F6E56'
const FREE_DELIVERY_THRESHOLD = 1000

function formatBnInteger(n: number) {
  return Math.round(n).toLocaleString('bn-BD')
}

function formatPriceBn(n: number) {
  return `৳ ${formatBnInteger(n)}`
}

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

interface BestSellerProduct {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sellingPrice: number
  mrp: number | null
  discountPercentage: number | null
  stockQuantity: number
  type: 'MEDICINE' | 'GENERAL'
  category: { id: string; name: string; slug: string }
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

  const [bestSellers, setBestSellers] = useState<BestSellerProduct[]>([])

  // Free delivery progress
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - total)
  const progress = Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100)
  const hasFreeDelivery = total >= FREE_DELIVERY_THRESHOLD

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

  // Fetch best sellers for upsell when drawer opens
  useEffect(() => {
    if (!isDrawerOpen) return
    fetch('/api/products/best-sellers?limit=4')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.products)) {
          // Filter out products already in cart
          const cartIds = new Set(items.map(i => i.productId || i.medicineId || i.id))
          setBestSellers(d.products.filter((p: BestSellerProduct) => !cartIds.has(p.id)).slice(0, 3))
        }
      })
      .catch(() => {})
  }, [isDrawerOpen, items])

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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E1F5EE]"
              aria-hidden
            >
              <ShoppingBag className="h-3.5 w-3.5" style={{ color: CHECKOUT_GREEN }} />
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
            className="cursor-pointer rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="কার্ট বন্ধ করুন"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free Delivery Progress Bar */}
        {items.length > 0 && (
          <div className={`px-5 py-3 ${hasFreeDelivery ? 'bg-green-50' : 'bg-orange-50'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 shrink-0" style={{ color: hasFreeDelivery ? '#0F6E56' : '#ea580c' }} />
                {hasFreeDelivery ? (
                  <span className="text-xs font-semibold text-green-700">🎉 ফ্রি ডেলিভারি পেয়েছেন!</span>
                ) : (
                  <span className="text-xs font-medium text-orange-700">
                    আরও <span className="font-bold">৳{Math.ceil(remaining)}</span> যোগ করুন → ফ্রি ডেলিভারি
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-500">৳{FREE_DELIVERY_THRESHOLD} এ ফ্রি</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: hasFreeDelivery ? '#0F6E56' : '#ea580c',
                }}
              />
            </div>
          </div>
        )}

        {/* Line items */}
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-gray-500">
              <ShoppingBag className="mb-4 h-16 w-16 opacity-20" />
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
            <>
              {items.map((item, index) => {
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
              })}

              {/* Best Sellers Upsell */}
              {bestSellers.length > 0 && (
                <div className="mt-2 border-t border-dashed border-gray-200 px-5 pt-4 pb-2">
                  <div className="mb-3 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-gray-700">সাথে নিন — Best Sellers</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {bestSellers.map(p => {
                      const price = p.discountPercentage && p.mrp
                        ? p.mrp * (1 - p.discountPercentage / 100)
                        : p.sellingPrice
                      return (
                        <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                          <Link
                            href={p.type === 'MEDICINE' ? `/medicines/${p.slug}` : `/products/${p.slug}`}
                            onClick={closeDrawer}
                            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white border border-gray-100 flex items-center justify-center"
                          >
                            {p.imageUrl ? (
                              <Image src={p.imageUrl} alt={p.name} fill sizes="40px" className="object-contain" unoptimized />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400">{p.name.charAt(0)}</span>
                            )}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-[12px] font-medium text-gray-800">{p.name}</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-xs font-bold" style={{ color: CHECKOUT_GREEN }}>৳{Math.round(price)}</span>
                              {p.mrp && p.discountPercentage && (
                                <span className="text-[10px] text-gray-400 line-through">৳{p.mrp}</span>
                              )}
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                            <AddToCartButton
                              productId={p.id}
                              name={p.name}
                              price={price}
                              image={p.imageUrl ?? undefined}
                              stockQuantity={p.stockQuantity}
                              category={p.category.name}
                              mrp={p.mrp ?? undefined}
                              slug={p.slug}
                              type={p.type === 'MEDICINE' ? 'MEDICINE' : 'PRODUCT'}
                              variant="outline"
                              className="text-xs px-2 py-1"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200/80 bg-gray-50 px-5 py-3.5">

            {/* Savings highlight */}
            {totalSavings > 0 && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span className="text-xs font-medium text-green-700">আপনি বাঁচাচ্ছেন</span>
                </div>
                <span className="text-sm font-bold text-green-700">{formatPriceBn(totalSavings)}</span>
              </div>
            )}

            <div className="mb-1.5 flex justify-between text-[13px] text-gray-600">
              <span>মোট এম.আর.পি মূল্য</span>
              <span>{formatPriceBn(mrpTotal)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="mb-2 flex justify-between text-xs text-[#0F6E56]">
                <span>ডিসকাউন্টে বাঁচলেন</span>
                <span>− {formatPriceBn(totalSavings)}</span>
              </div>
            )}
            <div className="mb-3.5 flex justify-between text-[14px] font-medium text-gray-900">
              <span>সর্বমোট মূল্য</span>
              <span className="text-base font-bold" style={{ color: CHECKOUT_GREEN }}>
                {formatPriceBn(total)}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="flex w-full items-center justify-center rounded-xl py-3.5 text-[15px] font-bold text-white transition-all hover:opacity-95 hover:-translate-y-0.5 shadow-md"
              style={{ backgroundColor: CHECKOUT_GREEN }}
            >
              চেকআউট করুন →
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
                onClick={() => { clearCart() }}
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
