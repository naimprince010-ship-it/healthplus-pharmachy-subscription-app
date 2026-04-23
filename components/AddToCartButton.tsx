'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { useCart, buildUnitLabelBn, SellingUnitType } from '@/contexts/CartContext'
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
  genericName?: string
  mrp?: number
  slug?: string
  type?: 'MEDICINE' | 'PRODUCT'
  sellingUnitType?: SellingUnitType
  unitQuantity?: number
  baseUnitLabelBn?: string
  dosageForm?: string
  tabletsPerStrip?: number
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
  genericName,
  mrp,
  slug,
  type = 'MEDICINE',
  sellingUnitType,
  unitQuantity,
  baseUnitLabelBn,
  dosageForm,
  tabletsPerStrip,
}: AddToCartButtonProps) {
  const { addItem, updateQuantity, items } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const itemId = medicineId || productId
  const cartItem = itemId ? items.find(i => i.id === itemId) : undefined
  const cartQty = cartItem?.quantity ?? 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (requiresPrescription || stockQuantity === 0 || !itemId) return

    const unitLabelBn = buildUnitLabelBn({
      sellingUnitType,
      unitQuantity,
      baseUnitLabelBn,
      dosageForm,
      tabletsPerStrip,
    })

    addItem({
      id: itemId,
      medicineId,
      productId,
      name,
      price,
      image,
      type,
      category,
      genericName,
      mrp,
      slug,
      unitLabelBn,
      sellingUnitType,
      unitQuantity,
      baseUnitLabelBn,
    })

    trackAddToCart({ item_id: itemId, item_name: name, item_category: category, price, quantity: 1 })

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!itemId) return
    updateQuantity(itemId, cartQty + 1)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!itemId) return
    updateQuantity(itemId, cartQty - 1)
  }

  const isDisabled = requiresPrescription || stockQuantity === 0

  const tooltipContent = requiresPrescription
    ? 'Prescription required – please upload your prescription'
    : stockQuantity === 0
    ? 'Out of stock'
    : ''

  // ── Already in cart: show quantity stepper ──
  if (cartQty > 0) {
    return (
      <div className={`flex items-center justify-between gap-1 rounded-lg border-2 border-teal-600 bg-teal-50 overflow-hidden ${className}`}>
        <button
          type="button"
          onClick={handleDecrease}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-teal-700 hover:bg-teal-100 transition-colors"
          aria-label="Remove one"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <span className="flex-1 text-center text-sm font-bold text-teal-700 tabular-nums">
          {cartQty}
        </span>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={stockQuantity > 0 && cartQty >= stockQuantity}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-teal-700 hover:bg-teal-100 transition-colors disabled:opacity-40"
          aria-label="Add one more"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // ── Not in cart yet ──
  const button = (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isDisabled}
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        isDisabled
          ? 'cursor-not-allowed bg-gray-200 text-gray-400'
          : justAdded
          ? 'bg-green-500 text-white scale-95'
          : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-md active:scale-95'
      } ${className}`}
    >
      {justAdded ? (
        <>
          <Check className="h-4 w-4" />
          যোগ হয়েছে!
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          কার্টে যোগ করুন
        </>
      )}
    </button>
  )

  if (isDisabled && tooltipContent) {
    return <Tooltip content={tooltipContent}>{button}</Tooltip>
  }

  return button
}
