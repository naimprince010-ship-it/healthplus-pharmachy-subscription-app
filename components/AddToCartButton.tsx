'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { Tooltip } from '@/components/ui/Tooltip'
import { trackAddToCart } from '@/lib/trackEvent'

interface AddToCartButtonProps {
  medicineId?: string
  productId?: string
  name: string
  price: number
  image?: string
  requiresPrescription?: boolean
  stockQuantity?: number
  className?: string
  category?: string
  type?: 'MEDICINE' | 'PRODUCT'
}

export function AddToCartButton({
  medicineId,
  productId,
  name,
  price,
  image,
  requiresPrescription = false,
  stockQuantity = 0,
  className = '',
  category,
  type = 'MEDICINE',
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (requiresPrescription || stockQuantity === 0) {
      return
    }

    const itemId = medicineId || productId
    if (!itemId) {
      console.error('No medicineId or productId provided')
      return
    }

    setIsAdding(true)
    addItem({
      id: itemId,
      medicineId,
      productId,
      name,
      price,
      image,
      type,
    })

    trackAddToCart({
      item_id: itemId,
      item_name: name,
      item_category: category,
      price,
      quantity: 1,
    })

    setTimeout(() => setIsAdding(false), 1000)
  }

  const isDisabled = requiresPrescription || stockQuantity === 0

  const tooltipContent = requiresPrescription
    ? 'Prescription required – please upload your prescription'
    : stockQuantity === 0
    ? 'Out of stock'
    : ''

  const button = (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        isDisabled
          ? 'cursor-not-allowed bg-gray-300 text-gray-500'
          : isAdding
          ? 'bg-green-600 text-white'
          : 'bg-teal-600 text-white hover:bg-teal-700'
      } ${className}`}
    >
      <ShoppingCart className="h-4 w-4" />
      {isAdding ? 'Added!' : 'Add to Cart'}
    </button>
  )

  if (isDisabled && tooltipContent) {
    return <Tooltip content={tooltipContent}>{button}</Tooltip>
  }

  return button
}
