'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart, ChevronDown } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { trackAddToCart } from '@/lib/trackEvent'
import { getEffectivePrices } from '@/lib/pricing'

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
  slug: string
  variants?: ProductVariant[]
}

export function ProductDetailClient({
  productId,
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
  slug,
  variants = [],
}: ProductDetailClientProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const defaultVariant = variants.find(v => v.isDefault) || variants[0]
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id || null
  )

  const currentVariant = useMemo(() => {
    if (variants.length === 0) return null
    return variants.find(v => v.id === selectedVariantId) || defaultVariant
  }, [variants, selectedVariantId, defaultVariant])

  const { price, effectiveMrp, discountPercent, isFlashActive, unitLabel } = useMemo(() => {
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
    })

    return {
      price: computed.price,
      effectiveMrp: computed.mrp,
      discountPercent: computed.discountPercent,
      isFlashActive: computed.isFlashSale,
      unitLabel: unit ? `/${unit}` : '',
    }
  }, [currentVariant, sellingPrice, mrp, discountPercentage, flashSalePrice, flashSaleStart, flashSaleEnd, isFlashSale, unit])

  const currentStock = currentVariant ? currentVariant.stockQuantity : stockQuantity
  const hasDiscount = discountPercent > 0

  const handleAddToCart = () => {
    if (currentStock === 0) return

    setIsAdding(true)
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
    })

    trackAddToCart({
      item_id: productId,
      item_name: name,
      item_category: category,
      item_variant: currentVariant?.variantName,
      price,
      quantity,
    })

    setTimeout(() => setIsAdding(false), 1000)
  }

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId)
    setIsDropdownOpen(false)
    // Do NOT reset quantity when variant changes (per MedEasy behavior)
  }

  const isOutOfStock = currentStock === 0

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {hasDiscount ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 line-through">MRP ৳{effectiveMrp.toFixed(2)}</span>
              <span className={`text-sm font-semibold ${isFlashActive ? 'text-orange-500' : 'text-red-500'}`}>
                {Math.round(discountPercent)}% {isFlashActive ? 'OFF' : 'ডিস্কাউন্ট'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-gray-600">Best Price</span>
              <span className="text-2xl font-bold text-gray-900">Tk {price.toFixed(2)}</span>
              {unitLabel && <span className="text-gray-500">{unitLabel}</span>}
            </div>
          </>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">৳{price.toFixed(2)}</span>
            {unitLabel && <span className="text-gray-500">{unitLabel}</span>}
          </div>
        )}
      </div>

      {/* MedEasy-style Variant Selector - Always show if variants exist (even single variant) */}
      {variants.length > 0 && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pack Size
          </label>
          <button
            type="button"
            onClick={() => variants.length > 1 && setIsDropdownOpen(!isDropdownOpen)}
            disabled={variants.length === 1}
            className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${
              variants.length === 1
                ? 'border-gray-200 cursor-default'
                : isDropdownOpen
                  ? 'border-teal-500 ring-2 ring-teal-100'
                  : 'border-gray-300 hover:border-teal-400'
            }`}
          >
            <span className="font-medium text-gray-900">
              {currentVariant?.variantName || 'Select variant'}
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
                  className={`w-full px-4 py-3 text-left transition-colors duration-150 ${
                    index === 0 ? 'rounded-t-lg' : ''
                  } ${
                    index === variants.length - 1 ? 'rounded-b-lg' : ''
                  } ${
                    variant.id === selectedVariantId 
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
                          {Math.round(variant.discountPercentage)}% OFF
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
              Quantity
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

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold transition-all duration-200 ${
              isAdding
                ? 'bg-green-600 text-white scale-[0.98]'
                : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98]'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            {isAdding ? 'Added!' : 'কার্টে যোগ করুন'}
          </button>
        </div>
      )}

      {isOutOfStock && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-center">
          <span className="font-medium text-red-600">Out of Stock</span>
        </div>
      )}

      {currentStock > 0 && currentStock < 10 && (
        <p className="text-sm text-orange-600">
          Only {currentStock} left in stock - order soon!
        </p>
      )}
    </div>
  )
}
