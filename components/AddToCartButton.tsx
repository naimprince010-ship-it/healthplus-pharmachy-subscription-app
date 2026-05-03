'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { useCart, buildUnitLabelBn, SellingUnitType } from '@/contexts/CartContext'
import { Tooltip } from '@/components/ui/Tooltip'
import { trackAddToCart } from '@/lib/trackEvent'
import { logProductInteraction } from '@/lib/logProductInteraction'

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

    logProductInteraction({
      kind: 'ADD_TO_CART',
      productId: productId ?? undefined,
      medicineId: medicineId ?? undefined,
    })

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

  if (cartQty > 0) {
    return (
      <div className={`flex items-center justify-between gap-1 rounded-lg border-2 border-cta-light bg-orange-50 overflow-hidden ${className}`}>
        <button
          type="button"
          onClick={handleDecrease}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-cta-dark hover:bg-orange-100 transition-colors"
          aria-label="Remove one"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <span className="flex-1 text-center text-sm font-bold text-cta-dark tabular-nums">
          {cartQty}
        </span>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={stockQuantity > 0 && cartQty >= stockQuantity}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-cta-dark hover:bg-orange-100 transition-colors disabled:opacity-40"
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
      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
        isDisabled
          ? 'cursor-not-allowed bg-gray-200 text-gray-400'
          : justAdded
          ? 'bg-green-500 text-white scale-95'
          : 'bg-cta text-white hover:bg-cta-dark hover:shadow-[0_4px_12px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
      } ${className}`}
    >
      {justAdded ? (
        <>
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>যোগ হয়েছে!</span>
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 flex-shrink-0" />
          <span>কার্টে যোগ করুন</span>
        </>
      )}
    </button>
  )

  if (isDisabled && tooltipContent) {
    return <Tooltip content={tooltipContent}>{button}</Tooltip>
  }

  return button
}
