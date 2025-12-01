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
    setQuantity(1)
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

      {variants.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <span className="font-medium text-gray-900">
              {currentVariant?.variantName || 'Select variant'}
            </span>
            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleVariantSelect(variant.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    variant.id === selectedVariantId ? 'bg-teal-50 text-teal-700' : 'text-gray-900'
                  } ${variant.stockQuantity === 0 ? 'opacity-50' : ''}`}
                  disabled={variant.stockQuantity === 0}
                >
                  <div className="flex justify-between items-center">
                    <span>{variant.variantName}</span>
                    {variant.stockQuantity === 0 && (
                      <span className="text-xs text-red-500">Out of stock</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!isOutOfStock && (
        <div className="space-y-4">
          <div className="flex items-center justify-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-6 py-3 text-xl font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="px-6 py-3 text-lg font-medium text-gray-900 border-x border-gray-300">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
              className="px-6 py-3 text-xl font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              disabled={quantity >= currentStock}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-semibold transition-colors ${
              isAdding
                ? 'bg-green-600 text-white'
                : 'bg-teal-600 text-white hover:bg-teal-700'
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
