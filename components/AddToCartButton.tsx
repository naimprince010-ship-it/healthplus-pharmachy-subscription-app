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
  /** Solid orange (default) or lighter outline — better for dense product grids. */
  variant?: 'solid' | 'outline'
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
  variant = 'solid',
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

  const outlineTone = variant === 'outline'

  if (cartQty > 0) {
    return (
      <div
        className={`flex items-center justify-between gap-1 overflow-hidden rounded-lg border-2 ${
          outlineTone ? 'border-gray-200 bg-slate-50' : 'border-cta-light bg-orange-50'
        } ${className}`}
      >
        <button
          type="button"
          onClick={handleDecrease}
          className={`flex h-10 w-10 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center transition-colors ${
            outlineTone ? 'text-slate-700 hover:bg-slate-100' : 'text-cta-dark hover:bg-orange-100'
          }`}
          aria-label="Remove one"
        >
          <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </button>

        <span className="flex-1 text-center text-sm font-bold text-cta-dark tabular-nums">
          {cartQty}
        </span>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={stockQuantity > 0 && cartQty >= stockQuantity}
          className={`flex h-10 w-10 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center transition-colors disabled:opacity-40 ${
            outlineTone ? 'text-slate-700 hover:bg-slate-100' : 'text-cta-dark hover:bg-orange-100'
          }`}
          aria-label="Add one more"
        >
          <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </button>
      </div>
    )
  }

  // ── Not in cart yet ──
  const solidEnabled =
    'bg-cta text-white hover:bg-cta-dark hover:shadow-[0_4px_12px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
  const outlineEnabled =
    'border border-emerald-600/85 bg-white text-emerald-800 hover:bg-emerald-50/90 active:scale-[0.98] shadow-sm'

  const button = (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isDisabled}
      className={`flex items-center justify-center gap-1.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
        isDisabled
          ? 'cursor-not-allowed bg-gray-200 text-gray-400 px-3 py-2 text-sm font-semibold'
          : justAdded
            ? 'bg-green-600 text-white px-3 py-2 text-sm font-semibold scale-95'
            : outlineTone
              ? `px-2.5 py-1.5 text-xs font-semibold ${outlineEnabled}`
              : `px-3 py-2 text-sm font-semibold ${solidEnabled}`
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
          <span className="hidden sm:inline">কার্টে যোগ করুন</span>
          <span className="inline sm:hidden">অ্যাড</span>
        </>
      )}
    </button>
  )

  if (isDisabled && tooltipContent) {
    return <Tooltip content={tooltipContent}>{button}</Tooltip>
  }

  return button
}
