'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart, buildUnitLabelBn } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useSession } from 'next-auth/react'
import { ArrowLeft, X, Heart, Minus, Plus, Clock, Lock, ChevronRight, Truck, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

interface SuggestionProduct {
  id: string
  name: string
  price: number
  mrp?: number
  imageUrl: string | null
  slug: string
  /** Legacy medicine rows from /api/products use MEDICINE + /medicines/… */
  catalogKind?: 'PRODUCT' | 'MEDICINE'
  productHref?: string
}

function mapCatalogRowToSuggestion(p: {
  id: string
  name: string
  slug: string
  imageUrl?: string | null
  sellingPrice?: number | null
  price?: number
  mrp?: number | null
  type?: string
  href?: string
}): SuggestionProduct {
  const isMedicine = p.type === 'MEDICINE'
  const href = p.href ?? (isMedicine ? `/medicines/${p.slug}` : `/products/${p.slug}`)
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl ?? null,
    price: Number(p.sellingPrice ?? p.price ?? 0),
    mrp: p.mrp ?? undefined,
    catalogKind: isMedicine ? 'MEDICINE' : 'PRODUCT',
    productHref: href,
  }
}

interface CartSettings {
  freeDeliveryThreshold: number
  freeDeliveryTextBn: string
  freeDeliverySuccessTextBn: string
  promoLabelBn: string
  promoApplyTextBn: string
  deliveryInfoTextBn: string
  totalMrpLabelBn: string
  savingsLabelBn: string
  grandTotalLabelBn: string
  checkoutButtonTextBn: string
  suggestionTitleBn: string
  emptyCartTextBn: string
  emptyCartSubtextBn: string
  startShoppingTextBn: string
  cartTitleBn: string
}

const DEFAULT_SETTINGS: CartSettings = {
  freeDeliveryThreshold: 499,
  freeDeliveryTextBn: 'আর মাত্র ৳{remaining} টাকার পণ্য কিনলে ফ্রি ডেলিভারি পাবেন!',
  freeDeliverySuccessTextBn: 'অভিনন্দন! আপনি ফ্রি ডেলিভারি পেয়েছেন 🎉',
  promoLabelBn: 'প্রোমো কোড ব্যবহার করুন',
  promoApplyTextBn: '[Apply]',
  deliveryInfoTextBn: 'আনুমানিক ডেলিভারি: আগামীকাল',
  totalMrpLabelBn: 'মোট এম.আর.পি:',
  savingsLabelBn: 'আপনি সাশ্রয় করছেন:',
  grandTotalLabelBn: 'সর্বমোট:',
  checkoutButtonTextBn: 'নিরাপদ চেকআউট',
  suggestionTitleBn: 'আপনার জন্য সাজেশন',
  emptyCartTextBn: 'আপনার কার্ট খালি',
  emptyCartSubtextBn: 'পণ্য যোগ করুন শপিং শুরু করতে',
  startShoppingTextBn: 'শপিং শুরু করুন',
  cartTitleBn: 'আপনার কার্ট',
}

/** পণ্য লিস্টের `AddToCartButton` / চেকআউট / প্রোমো — একই কমলা */
const BTN_ORANGE_CTA =
  'bg-orange-500 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2'
const BTN_ORANGE_CTA_DISABLED =
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-orange-500 disabled:active:bg-orange-500'

/** সাজেশন কার্ড — গ্রিডের কার্ট বাটনের মতো */
const BTN_ADD_TO_CART_ORANGE =
  'flex w-full items-center justify-center gap-1 rounded-lg bg-orange-500 px-1.5 py-2 text-[10px] font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 sm:gap-1.5 sm:px-2 sm:text-xs lg:text-sm'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount, isInitialized, addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([])
  const [suggestionsReady, setSuggestionsReady] = useState(false)
  const [settings, setSettings] = useState<CartSettings>(DEFAULT_SETTINGS)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; id: string } | null>(null)

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

  const cartLineQuery = useMemo(
    () =>
      items
        .map((i) => i.medicineId || i.productId)
        .filter(Boolean)
        .join(','),
    [items]
  )

  // Settings + suggestions: অ্যাডমিন ম্যানুয়াল, না হলে সার্ভার ইঞ্জিন (অর্ডার/ক্যাটাগরি)
  useEffect(() => {
    let cancelled = false
    const fetchCartConfig = async () => {
      try {
        const qs = cartLineQuery
          ? `?cart=${encodeURIComponent(cartLineQuery)}`
          : ''
        const res = await fetch(`/api/cart/settings${qs}`)
        const data = await res.json()
        if (cancelled) return
        if (data.settings) {
          setSettings(data.settings)
        }
        const list = data.suggestions as SuggestionProduct[] | undefined
        if (list?.length) {
          const mapped: SuggestionProduct[] = list.map((s) => ({
            ...s,
            catalogKind: 'PRODUCT',
            productHref: `/products/${s.slug}`,
          }))
          setSuggestions(mapped)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error('Failed to fetch cart config:', error)
        if (cancelled) return
        try {
          const fallbackRes = await fetch(
            '/api/products?limit=16&sortBy=stockQuantity&sortOrder=desc'
          )
          const fallbackData = await fallbackRes.json()
          if (cancelled) return
          if (fallbackData.products?.length) {
            setSuggestions(
              fallbackData.products
                .slice(0, 12)
                .map((p: {
                  id: string
                  name: string
                  slug: string
                  imageUrl?: string | null
                  sellingPrice?: number | null
                  price?: number
                  mrp?: number | null
                  type?: string
                  href?: string
                }) => mapCatalogRowToSuggestion(p))
            )
          } else {
            setSuggestions([])
          }
        } catch {
          if (!cancelled) setSuggestions([])
        }
      } finally {
        if (!cancelled) setSuggestionsReady(true)
      }
    }
    fetchCartConfig()
    return () => {
      cancelled = true
    }
  }, [cartLineQuery])

  const cartLineIds = useMemo(
    () =>
      new Set(
        items.flatMap((i) =>
          [i.productId, i.medicineId].filter(Boolean) as string[]
        )
      ),
    [items]
  )

  const visibleSuggestions = useMemo(
    () => suggestions.filter((s) => !cartLineIds.has(s.id)),
    [suggestions, cartLineIds]
  )

  // Gate content behind readiness check to avoid hydration mismatch
  const isReady = isInitialized && status !== 'loading'

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#F4F6F8]">
        {/* Mobile header skeleton */}
        <div className="sticky top-0 z-50 flex items-center gap-3 bg-white px-4 py-3 shadow-sm lg:hidden">
          <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        {/* Loading skeleton */}
        <div className="px-4 py-4">
          <div className="mb-3 h-10 animate-pulse rounded-lg bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white p-3 shadow-sm">
                <div className="flex gap-3">
                  <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calculate MRP total (sum of mrp * quantity for items with mrp, otherwise use price)
  const mrpTotal = items.reduce((sum, item) => {
    const mrp = item.mrp || item.price
    return sum + mrp * item.quantity
  }, 0)

  // Calculate total savings
  const totalSavings = mrpTotal - total

  // Free delivery progress (using admin-configured threshold)
  const remaining = Math.max(0, settings.freeDeliveryThreshold - total)
  const progressPercent = Math.min(100, (total / settings.freeDeliveryThreshold) * 100)
  const hasFreeDelivery = total >= settings.freeDeliveryThreshold

  // Handle promo code apply
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('প্রোমো কোডটি লিখুন')
      return
    }

    setIsApplyingPromo(true)
    try {
      const res = await fetch('/api/cart/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          cartTotal: total,
          userId: session?.user?.id
        })
      })

      const data = await res.json()

      if (res.ok && data.valid) {
        setDiscount(data.discount)
        setPromoApplied(true)
        setAppliedCoupon({ code: data.coupon.code, id: data.coupon.id })
        toast.success('প্রোমো কোডটি সফলভাবে অ্যাপ্লাই হয়েছে!')
      } else {
        toast.error(data.error || 'প্রোমো কোডটি সঠিক নয়')
      }
    } catch (error) {
      toast.error('প্রোমো কোড অ্যাপ্লাই করতে সমস্যা হয়েছে')
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setPromoApplied(false)
    setDiscount(0)
    setAppliedCoupon(null)
    setPromoCode('')
    toast.success('প্রোমো কোডটি রিমুভ করা হয়েছে')
  }

  // Add suggestion to cart
  const handleAddSuggestion = (product: SuggestionProduct) => {
    if (product.catalogKind === 'MEDICINE') {
      addItem({
        id: product.id,
        medicineId: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.imageUrl || undefined,
        type: 'MEDICINE',
        slug: product.slug,
        unitLabelBn: buildUnitLabelBn({}),
      })
      return
    }
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.imageUrl || undefined,
      type: 'PRODUCT',
      slug: product.slug,
      unitLabelBn: buildUnitLabelBn({}),
    })
  }

  const suggestionHref = (p: SuggestionProduct) =>
    p.productHref ?? `/products/${p.slug}`

  const renderSuggestionsBlock = (opts: { compact?: boolean }) => {
    const showSkeleton = !suggestionsReady && suggestions.length === 0
    if (!showSkeleton && visibleSuggestions.length === 0) return null

    return (
      <div className={opts.compact ? 'mt-8 w-full self-stretch' : 'mt-6 lg:mt-10'}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 lg:text-xl">
            <span aria-hidden>💡</span> {settings.suggestionTitleBn}
          </h2>
          <Link
            href="/products"
            className="flex items-center gap-0.5 rounded-md text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700 active:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 lg:text-base"
            aria-label="সব পণ্য দেখুন"
          >
            <span className="hidden sm:inline">আরও</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-nowrap gap-3 lg:gap-4">
            {showSkeleton
              ? [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex min-h-[220px] min-w-[140px] max-w-[160px] flex-shrink-0 flex-col rounded-xl bg-white p-3 shadow-sm lg:min-w-[180px] lg:max-w-[200px]"
                  >
                    <div className="mb-2 h-20 w-full animate-pulse rounded-lg bg-gray-200 lg:h-28" />
                    <div className="mb-2 h-4 w-full animate-pulse rounded bg-gray-200" />
                    <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="mb-2 h-5 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="mt-auto h-9 w-full animate-pulse rounded-lg bg-gray-200" />
                  </div>
                ))
              : visibleSuggestions.map((product) => (
                  <div
                    key={product.id}
                    className="flex min-h-[220px] min-w-[140px] max-w-[160px] flex-shrink-0 flex-col rounded-xl bg-white p-3 shadow-sm lg:min-w-[180px] lg:max-w-[200px]"
                  >
                    <Link href={suggestionHref(product)} className="block min-w-0">
                      <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg bg-gray-100 lg:h-28">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 160px, 200px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No img
                          </div>
                        )}
                      </div>
                      <p className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-gray-900 lg:min-h-[3rem] lg:text-base">
                        {product.name}
                      </p>
                    </Link>
                    <div className="mb-2 flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-bold text-gray-900 lg:text-base">
                        ৳{product.price.toFixed(0)}
                      </span>
                      {product.mrp != null &&
                        product.mrp > product.price && (
                          <span className="text-xs text-gray-400 line-through lg:text-sm">
                            ৳{product.mrp.toFixed(0)}
                          </span>
                        )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSuggestion(product)}
                      className={`mt-auto ${BTN_ADD_TO_CART_ORANGE}`}
                    >
                      <ShoppingCart className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" aria-hidden />
                      <span className="text-center leading-tight">কার্টে যোগ করুন</span>
                    </button>
                  </div>
                ))}
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F6F8]">
        {/* Mobile header */}
        <div className="sticky top-0 z-50 flex items-center gap-3 bg-white px-4 py-3 shadow-sm lg:hidden">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{settings.cartTitleBn} (0)</h1>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="mx-auto mb-4 h-24 w-24 text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700">{settings.emptyCartTextBn}</p>
          <p className="mt-1 text-sm text-gray-500">{settings.emptyCartSubtextBn}</p>
          <Link
            href="/"
            className={`mt-6 inline-flex items-center justify-center rounded-full px-8 py-3 ${BTN_ORANGE_CTA}`}
          >
            {settings.startShoppingTextBn}
          </Link>
          {renderSuggestionsBlock({ compact: true })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24 lg:pb-8">
      {/* Mobile header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 bg-white px-4 py-3 shadow-sm lg:hidden">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{settings.cartTitleBn} ({itemCount})</h1>
      </div>

      {/* Main content */}
      <div className="px-4 py-4 lg:mx-auto lg:max-w-7xl lg:px-8">
        {/* Free Delivery Progress Bar */}
        <div className="mb-3 rounded-xl bg-white p-3 shadow-sm lg:hidden">
          {hasFreeDelivery ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <p className="text-sm font-medium text-[#00A651]">
                {settings.freeDeliverySuccessTextBn}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-[#00A651]" />
                <p className="text-sm text-gray-700">
                  {settings.freeDeliveryTextBn.replace('{remaining}', remaining.toFixed(0))}
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00A651] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Cart Items */}
        <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const itemId = item.medicineId || item.productId || ''
              const hasDiscount = item.mrp && item.mrp > item.price
              const requiresPrescription = item.category?.toLowerCase().includes('antibiotic') ||
                item.category?.toLowerCase().includes('prescription')

              return (
                <div key={itemId} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <Link href={`/products/${item.slug || itemId}`} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </Link>

                    {/* Product Details */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                          {(item.genericName || item.category) && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {item.genericName || item.category}
                            </p>
                          )}
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleWishlist(item.productId || itemId)}
                            className={`p-1 transition-colors ${isInWishlist(item.productId || itemId) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                            aria-label={isInWishlist(item.productId || itemId) ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <Heart
                              className="h-5 w-5"
                              fill={isInWishlist(item.productId || itemId) ? 'currentColor' : 'none'}
                            />
                          </button>
                          <button
                            onClick={() => removeItem(itemId)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            aria-label="Remove item"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Price Row */}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">৳ {item.price.toFixed(0)}</span>
                        {hasDiscount && (
                          <span className="text-sm text-gray-400 line-through">৳{item.mrp?.toFixed(0)}</span>
                        )}
                        {requiresPrescription && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF4D4F] px-2 py-0.5 text-xs font-medium text-white">
                            ⚠️ প্রেসক্রিপশন প্রয়োজন (Rx)
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {item.unitLabelBn || item.variantLabel || '/ ১ পিস'}
                        </p>
                        <div className="flex items-center rounded-lg border border-gray-200">
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50"
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

          {/* Desktop Order Summary */}
          <div className="hidden lg:block">
            <div className="sticky top-4 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">অর্ডার সারাংশ</h2>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{settings.totalMrpLabelBn}</span>
                  <span className="font-medium text-gray-900">৳ {mrpTotal.toFixed(0)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">{settings.savingsLabelBn}</span>
                    <span className="font-semibold text-green-600">৳ {totalSavings.toFixed(0)}</span>
                  </div>
                )}

                {promoApplied && discount > 0 && (
                  <div className="flex justify-between text-sm py-1 border-y border-dashed border-green-200 my-1">
                    <span className="text-green-600">কুপন ডিসকাউন্ট:</span>
                    <span className="font-semibold text-green-600">- ৳ {discount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-3">
                  <span className="font-bold text-gray-900">{settings.grandTotalLabelBn}</span>
                  <span className="text-xl font-bold text-gray-900">৳ {(total - discount).toFixed(0)}</span>
                </div>
              </div>

              {/* Desktop Promo Code */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🎫</span>
                  <span className="text-sm font-semibold text-gray-700">{settings.promoLabelBn}</span>
                </div>

                {!promoApplied ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="কোডটি লিখুন"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo}
                      type="button"
                      className={`rounded-lg px-4 py-2 text-sm ${BTN_ORANGE_CTA} ${BTN_ORANGE_CTA_DISABLED}`}
                    >
                      {isApplyingPromo ? '...' : settings.promoApplyTextBn.replace('[', '').replace(']', '')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 border border-green-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        {appliedCoupon?.code}
                      </span>
                      <span className="text-xs text-green-600">Applied</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-xs font-bold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {!session ? (
                  <Link
                    href="/auth/signin?redirect=/cart"
                    className={`flex w-full items-center justify-center gap-2 rounded-full py-3 ${BTN_ORANGE_CTA}`}
                  >
                    <Lock className="h-4 w-4" />
                    {settings.checkoutButtonTextBn}
                  </Link>
                ) : (
                  <Link
                    href="/checkout"
                    className={`flex w-full items-center justify-center gap-2 rounded-full py-3 ${BTN_ORANGE_CTA}`}
                  >
                    <Lock className="h-4 w-4" />
                    {settings.checkoutButtonTextBn}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {renderSuggestionsBlock({})}

        <div className="mt-6 rounded-xl bg-white p-4 shadow-sm lg:hidden">
          {/* Promo Code Row */}
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎫</span>
              <span className="text-sm font-semibold text-gray-700">{settings.promoLabelBn}</span>
            </div>

            {!promoApplied ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="কোডটি লিখুন"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={isApplyingPromo}
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm ${BTN_ORANGE_CTA} ${BTN_ORANGE_CTA_DISABLED}`}
                >
                  {isApplyingPromo ? '...' : settings.promoApplyTextBn.replace('[', '').replace(']', '')}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 border border-green-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    {appliedCoupon?.code}
                  </span>
                  <span className="text-xs text-green-600">Applied</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="text-xs font-bold text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Delivery Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{settings.deliveryInfoTextBn}</span>
          </div>
        </div>

        {/* Mobile Summary (above sticky footer) */}
        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm lg:hidden">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{settings.totalMrpLabelBn}</span>
            <span className="text-gray-700">৳ {mrpTotal.toFixed(0)}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-600">{settings.savingsLabelBn}</span>
              <span className="font-semibold text-green-600">৳ {totalSavings.toFixed(0)}</span>
            </div>
          )}
          {promoApplied && discount > 0 && (
            <div className="flex justify-between text-sm mb-1 py-1 border-y border-dashed border-green-200 my-1">
              <span className="text-green-600">কুপন ডিসকাউন্ট:</span>
              <span className="font-semibold text-green-600">- ৳ {discount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-bold text-gray-900">{settings.grandTotalLabelBn}</span>
            <span className="text-xl font-bold text-gray-900">৳ {(total - discount).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.1)] lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="px-4 py-3">
          {!session ? (
            <Link
              href="/auth/signin?redirect=/cart"
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base ${BTN_ORANGE_CTA}`}
            >
              <Lock className="h-5 w-5" />
              {settings.checkoutButtonTextBn}
            </Link>
          ) : (
            <Link
              href="/checkout"
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base ${BTN_ORANGE_CTA}`}
            >
              <Lock className="h-5 w-5" />
              {settings.checkoutButtonTextBn}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
