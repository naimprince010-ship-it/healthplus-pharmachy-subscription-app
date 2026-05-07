'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { ShoppingCart, ChevronDown, Truck, Zap } from 'lucide-react'
import { useCart, buildUnitLabelBn } from '@/contexts/CartContext'
import { trackAddToCart } from '@/lib/trackEvent'
import { logProductInteraction } from '@/lib/logProductInteraction'
import { getEffectivePrices } from '@/lib/pricing'

const FREE_DELIVERY_THRESHOLD = 1000

interface ProductVariant {
  id: string
  variantName: string
  unitLabel: string
  sizeLabel: string | null
  mrp: number | null
  sellingPrice: number
  discountPercentage: number | null
  stockQuantity: number
  isDefault: boolean
}

interface ProductDetailClientProps {
  productId: string
  /** Canonical short URL for sharing (e.g. Facebook): `/p/{id}` → product page */
  shortShareUrl?: string
  name: string
  sellingPrice: number
  mrp: number | null
  stockQuantity: number
  imageUrl: string | null
  category: string
  unit: string | null
  discountPercentage?: number | null
  flashSalePrice?: number | null
  flashSaleStart?: Date | string | null
  flashSaleEnd?: Date | string | null
  isFlashSale?: boolean | null
  campaignPrice?: number | null
  campaignStart?: Date | string | null
  campaignEnd?: Date | string | null
  slug: string
  variants?: ProductVariant[]
  unitPrice?: number | null
  stripPrice?: number | null
  tabletsPerStrip?: number | null
}

export function ProductDetailClient({
  productId,
  shortShareUrl,
  name,
  sellingPrice,
  mrp,
  stockQuantity,
  imageUrl,
  category,
  unit,
  discountPercentage,
  flashSalePrice,
  flashSaleStart,
  flashSaleEnd,
  isFlashSale,
  campaignPrice,
  campaignStart,
  campaignEnd,
  slug,
  variants = [],
  unitPrice,
  stripPrice,
  tabletsPerStrip,
}: ProductDetailClientProps) {
  const { addItem } = useCart()

  useEffect(() => {
    logProductInteraction({ kind: 'VIEW_ITEM', productId })
  }, [productId])

  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [shortLinkCopied, setShortLinkCopied] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const addToCartRef = useRef<HTMLButtonElement>(null)

  const defaultVariant = variants.find(v => v.isDefault) || variants[0]
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id || null
  )

  const currentVariant = useMemo(() => {
    if (variants.length === 0) return null
    return variants.find(v => v.id === selectedVariantId) || defaultVariant
  }, [variants, selectedVariantId, defaultVariant])

  const { price, effectiveMrp, discountPercent, isFlashActive, isCampaignActive, unitLabel } = useMemo(() => {
    if (currentVariant) {
      const variantDiscount = currentVariant.discountPercentage || 0
      const variantMrp = currentVariant.mrp || currentVariant.sellingPrice
      const variantPrice = variantDiscount > 0
        ? variantMrp * (1 - variantDiscount / 100)
        : currentVariant.sellingPrice

      return {
        price: variantPrice,
        effectiveMrp: variantMrp,
        discountPercent: variantDiscount,
        isFlashActive: false,
        isCampaignActive: false,
        unitLabel: currentVariant.unitLabel,
      }
    }

    const computed = getEffectivePrices({
      sellingPrice,
      mrp,
      discountPercentage,
      flashSalePrice,
      flashSaleStart,
      flashSaleEnd,
      isFlashSale,
      campaignPrice,
      campaignStart,
      campaignEnd,
    })

    return {
      price: computed.price,
      effectiveMrp: computed.mrp,
      discountPercent: computed.discountPercent,
      isFlashActive: computed.isFlashSale,
      isCampaignActive: computed.isCampaign,
      unitLabel: unit ? `/${unit}` : '',
    }
  }, [currentVariant, sellingPrice, mrp, discountPercentage, flashSalePrice, flashSaleStart, flashSaleEnd, isFlashSale, campaignPrice, campaignStart, campaignEnd, unit])

  const currentStock = currentVariant ? currentVariant.stockQuantity : stockQuantity
  const hasDiscount = discountPercent > 0

  const handleAddToCart = () => {
    if (currentStock === 0) return

    setIsAdding(true)

    // Use variant's unitLabel if available, otherwise compute from unit
    const computedUnitLabelBn = currentVariant?.unitLabel
      ? currentVariant.unitLabel
      : buildUnitLabelBn({})

    addItem({
      id: currentVariant ? `${productId}-${currentVariant.id}` : productId,
      productId,
      variantId: currentVariant?.id,
      variantLabel: currentVariant?.variantName,
      name: currentVariant ? `${name} - ${currentVariant.variantName}` : name,
      price,
      image: imageUrl || undefined,
      type: 'PRODUCT',
      quantity,
      category,
      mrp: effectiveMrp,
      slug,
      unitLabelBn: computedUnitLabelBn,
    })

    trackAddToCart({
      item_id: productId,
      item_name: name,
      item_category: category,
      item_variant: currentVariant?.variantName,
      price,
      quantity,
    })

    logProductInteraction({ kind: 'ADD_TO_CART', productId })

    setTimeout(() => setIsAdding(false), 1000)
  }

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId)
    setIsDropdownOpen(false)
    // Do NOT reset quantity when variant changes (per MedEasy behavior)
  }

  const isOutOfStock = currentStock === 0

  // Show sticky bar when main Add to Cart button scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    )
    if (addToCartRef.current) observer.observe(addToCartRef.current)
    return () => observer.disconnect()
  }, [isOutOfStock])

  // Free delivery progress based on cart total
  const { total: cartTotal } = useCart()
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal)
  const freeDeliveryProgress = Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100)
  const hasFreeDelivery = cartTotal >= FREE_DELIVERY_THRESHOLD

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {hasDiscount ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 line-through">এমআরপি ৳{effectiveMrp.toFixed(2)}</span>
              <span className={`text-sm font-semibold ${isFlashActive ? 'text-orange-500' : isCampaignActive ? 'text-orange-500' : 'text-red-500'}`}>
                {Math.round(discountPercent)}% {isFlashActive || isCampaignActive ? 'ছাড়' : 'ডিস্কাউন্ট'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-gray-600">সেরা মূল্য</span>
              <span className="text-2xl font-bold text-teal-700">৳{price.toFixed(2)}</span>
              {unitLabel && <span className="text-gray-500">{unitLabel}</span>}
            </div>
            {(unitPrice || stripPrice || tabletsPerStrip) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {unitPrice && <span>৳{unitPrice.toFixed(2)} / পিস</span>}
                {stripPrice && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>৳{stripPrice.toFixed(2)} / পাতা</span>
                  </>
                )}
                {tabletsPerStrip && (
                  <span className="ml-1 text-gray-400">({tabletsPerStrip} পিস প্রতি পাতা)</span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-teal-700">৳{price.toFixed(2)}</span>
              {unitLabel && <span className="text-gray-500">{unitLabel}</span>}
            </div>
            {(unitPrice || stripPrice || tabletsPerStrip) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {unitPrice && <span>৳{unitPrice.toFixed(2)} / পিস</span>}
                {stripPrice && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>৳{stripPrice.toFixed(2)} / পাতা</span>
                  </>
                )}
                {tabletsPerStrip && (
                  <span className="ml-1 text-gray-400">({tabletsPerStrip} পিস প্রতি পাতা)</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MedEasy-style Variant Selector - Always show if variants exist (even single variant) */}
      {variants.length > 0 && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            আয়তন / প্যাক
          </label>
          <button
            type="button"
            onClick={() => variants.length > 1 && setIsDropdownOpen(!isDropdownOpen)}
            disabled={variants.length === 1}
            className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${variants.length === 1
              ? 'border-gray-200 cursor-default'
              : isDropdownOpen
                ? 'border-teal-500 ring-2 ring-teal-100'
                : 'border-gray-300 hover:border-teal-400'
              }`}
          >
            <span className="font-medium text-gray-900">
              {currentVariant?.variantName || 'ভেরিয়েন্ট বেছে নিন'}
            </span>
            {variants.length > 1 && (
              <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Dropdown menu with smooth animation */}
          {isDropdownOpen && variants.length > 1 && (
            <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {variants.map((variant, index) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleVariantSelect(variant.id)}
                  className={`w-full px-4 py-3 text-left transition-colors duration-150 ${index === 0 ? 'rounded-t-lg' : ''
                    } ${index === variants.length - 1 ? 'rounded-b-lg' : ''
                    } ${variant.id === selectedVariantId
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-gray-900 hover:bg-gray-50'
                    } ${variant.stockQuantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={variant.stockQuantity === 0}
                >
                  <div className="flex justify-between items-center">
                    <span>{variant.variantName}</span>
                    <div className="flex items-center gap-2">
                      {variant.mrp && variant.discountPercentage && variant.discountPercentage > 0 && (
                        <span className="text-xs text-red-500 font-medium">
                          {Math.round(variant.discountPercentage)}% ছাড়
                        </span>
                      )}
                      {variant.stockQuantity === 0 && (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">Out of stock</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MedEasy-style Quantity Selector */}
      {!isOutOfStock && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              পরিমাণ
            </label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-5 py-2.5 text-xl font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="px-6 py-2.5 text-lg font-semibold text-gray-900 border-x-2 border-gray-200 min-w-[60px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                className="px-5 py-2.5 text-xl font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={quantity >= currentStock}
              >
                +
              </button>
            </div>
          </div>

          {/* Free Delivery Progress */}
          <div className={`rounded-xl px-4 py-3 ${hasFreeDelivery ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 shrink-0" style={{ color: hasFreeDelivery ? '#0F6E56' : '#ea580c' }} />
                {hasFreeDelivery ? (
                  <span className="text-xs font-semibold text-green-700">🎉 ফ্রি ডেলিভারি পেয়েছেন!</span>
                ) : (
                  <span className="text-xs font-medium text-orange-700">
                    আরো <span className="font-bold">৳{Math.ceil(freeDeliveryRemaining)}</span> যোগ করুন → ফ্রি ডেলিভারি
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-500">৳{FREE_DELIVERY_THRESHOLD}-এ ফ্রি</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${freeDeliveryProgress}%`,
                  backgroundColor: hasFreeDelivery ? '#0F6E56' : '#ea580c',
                }}
              />
            </div>
          </div>

          <button
            ref={addToCartRef}
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex w-full max-w-sm items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold transition-all duration-200 ${isAdding
              ? 'bg-green-600 text-white scale-[0.98]'
              : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
              }`}
          >
            <ShoppingCart className="h-5 w-5" />
            {isAdding ? 'যোগ হয়েছে!' : 'কার্টে যোগ করুন'}
          </button>
        </div>
      )}

      {/* Sticky Add to Cart bar — appears on desktop when main button scrolls off screen */}
      {!isOutOfStock && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 hidden lg:flex items-center justify-between gap-4 bg-white border-t border-gray-200 px-6 py-3 shadow-xl transition-all duration-300 ${
            showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="text-sm font-bold text-gray-900 truncate max-w-[300px]">{name}</span>
            </div>
            <span className="text-base font-bold text-teal-700 shrink-0">৳{price.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 ${
              isAdding ? 'bg-green-600 scale-95' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {isAdding ? 'যোগ হয়েছে! ✓' : 'কার্টে যোগ করুন'}
          </button>
        </div>
      )}

      {isOutOfStock && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-center">
          <span className="font-medium text-red-600">স্টক নেই</span>
        </div>
      )}

      {shortShareUrl && (
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(shortShareUrl)
              setShortLinkCopied(true)
              setTimeout(() => setShortLinkCopied(false), 2500)
            } catch {
              // ignore
            }
          }}
          className="w-full max-w-sm rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {shortLinkCopied ? 'লিংক কপি হয়েছে ✓' : '🔗 শেয়ার করুন'}
        </button>
      )}

      {currentStock > 0 && currentStock < 10 && (
        <p className="text-sm text-orange-600">
          মাত্র {currentStock}টি বাকি — দ্রুত অর্ডার করুন।
        </p>
      )}

      {/* Sticky Mobile Bottom Bar (Only visible on mobile, positioned above bottom nav) */}
      {!isOutOfStock && (
        <div className="fixed bottom-[60px] left-0 right-0 z-40 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] md:hidden pb-safe">
          <div className="flex flex-col">
            {hasDiscount && <span className="text-xs font-medium text-gray-500 line-through">৳{effectiveMrp.toFixed(2)}</span>}
            <span className="text-lg font-bold text-teal-700 leading-tight">৳{price.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${isAdding
              ? 'bg-green-600 text-white scale-[0.98]'
              : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
              }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {isAdding ? 'যোগ হয়েছে!' : 'অ্যাড টু কার্ট'}
          </button>
        </div>
      )}
    </div>
  )
}
