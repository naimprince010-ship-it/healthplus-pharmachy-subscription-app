'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { QuantitySelector } from '@/components/QuantitySelector'
import { trackAddToCart } from '@/lib/trackEvent'

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
  slug: string
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
  slug,
}: ProductDetailClientProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  // Use explicit discountPercentage from database, or calculate from MRP as fallback
  const hasExplicitDiscount = discountPercentage && discountPercentage > 0
  const discountPercent = hasExplicitDiscount
    ? Math.round(discountPercentage)
    : (mrp && mrp > sellingPrice
      ? Math.round(((mrp - sellingPrice) / mrp) * 100)
      : null)
  
  // Calculate discounted price if explicit discount exists
  const discountedPrice = hasExplicitDiscount
    ? sellingPrice * (1 - discountPercentage / 100)
    : sellingPrice

  const handleAddToCart = () => {
    if (stockQuantity === 0) return

    setIsAdding(true)
    addItem({
      id: productId,
      productId,
      name,
      price: discountedPrice,
      image: imageUrl || undefined,
      type: 'PRODUCT',
      quantity,
      category,
      mrp: hasExplicitDiscount ? sellingPrice : (mrp || undefined),
      slug,
    })

    trackAddToCart({
      item_id: productId,
      item_name: name,
      item_category: category,
      price: discountedPrice,
      quantity,
    })

    setTimeout(() => setIsAdding(false), 1000)
  }

  const isOutOfStock = stockQuantity === 0

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {hasExplicitDiscount ? (
          <>
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-500 px-2 py-0.5 text-sm font-semibold text-white">
                {discountPercent}% ডিস্কাউন্ট
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">৳{discountedPrice.toFixed(2)}</span>
              <span className="text-lg text-gray-500 line-through">৳{sellingPrice.toFixed(2)}</span>
              {unit && <span className="text-sm text-gray-500">/{unit}</span>}
            </div>
          </>
        ) : mrp && mrp > sellingPrice ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">MRP</span>
              <span className="text-lg text-gray-500 line-through">৳{mrp.toFixed(2)}</span>
              <span className="rounded bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-600">
                {discountPercent}% OFF
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-teal-600">Best Price</span>
              <span className="text-3xl font-bold text-gray-900">৳{sellingPrice.toFixed(2)}</span>
              {unit && <span className="text-sm text-gray-500">/{unit}</span>}
            </div>
          </>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">৳{sellingPrice.toFixed(2)}</span>
            {unit && <span className="text-sm text-gray-500">/{unit}</span>}
          </div>
        )}
      </div>

      {!isOutOfStock && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Quantity</label>
            <QuantitySelector
              initialQuantity={1}
              min={1}
              max={Math.min(stockQuantity, 99)}
              onChange={setQuantity}
            />
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
            {isAdding ? 'Added to Cart!' : 'Add to Cart'}
          </button>
        </div>
      )}

      {isOutOfStock && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-center">
          <span className="font-medium text-red-600">Out of Stock</span>
        </div>
      )}

      {stockQuantity > 0 && stockQuantity < 10 && (
        <p className="text-sm text-orange-600">
          Only {stockQuantity} left in stock - order soon!
        </p>
      )}
    </div>
  )
}
