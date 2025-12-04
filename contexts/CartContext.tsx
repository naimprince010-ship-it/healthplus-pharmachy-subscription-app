'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Cart version - increment this when cart structure changes or pricing updates require clearing old carts
// Version 4: Add unitLabelBn for dynamic unit labels (strip/pack/bottle/piece)
const CART_VERSION = 4

export type SellingUnitType = 'PIECE' | 'STRIP' | 'PACK' | 'BOX' | 'BOTTLE'

export interface CartItem {
  id: string
  medicineId?: string
  productId?: string
  membershipPlanId?: string
  variantId?: string
  variantLabel?: string
  name: string
  price: number
  quantity: number
  image?: string
  type: 'MEDICINE' | 'PRODUCT' | 'MEMBERSHIP'
  category?: string
  genericName?: string
  mrp?: number
  slug?: string
  // Unit label fields for dynamic display (e.g., "/ ১ পাতা (১০ পিস)")
  unitLabelBn?: string
  sellingUnitType?: SellingUnitType
  unitQuantity?: number
  baseUnitLabelBn?: string
  // Membership-specific fields
  durationDays?: number
}

// Helper function to build unit label in Bangla
export function buildUnitLabelBn(opts: {
  sellingUnitType?: SellingUnitType
  unitQuantity?: number
  baseUnitLabelBn?: string
  dosageForm?: string
  tabletsPerStrip?: number
}): string {
  // Try to infer from existing medicine fields if no explicit type
  let type = opts.sellingUnitType
  let qty = opts.unitQuantity
  let base = opts.baseUnitLabelBn

  // Infer from dosageForm if not explicitly set
  if (!type && opts.dosageForm) {
    const form = opts.dosageForm.toLowerCase()
    if (form.includes('syrup') || form.includes('suspension') || form.includes('lotion') || form.includes('solution') || form.includes('drop')) {
      type = 'BOTTLE'
    } else if (form.includes('tablet') || form.includes('capsule')) {
      if (opts.tabletsPerStrip && opts.tabletsPerStrip > 1) {
        type = 'STRIP'
        qty = opts.tabletsPerStrip
        base = form.includes('capsule') ? 'ক্যাপসুল' : 'ট্যাবলেট'
      } else {
        type = 'PIECE'
      }
    }
  }

  // Default to PIECE if still not set
  type = type ?? 'PIECE'
  qty = qty ?? 1
  base = base ?? 'পিস'

  switch (type) {
    case 'PIECE':
      return '/ ১ পিস'
    case 'STRIP':
      return `/ ১ পাতা (${qty} ${base})`
    case 'PACK':
    case 'BOX':
      return `/ ${qty} ${base}`
    case 'BOTTLE':
      return '/ ১ বোতল'
    default:
      return '/ ১ পিস'
  }
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  isInitialized: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize with empty array to avoid hydration mismatch (server and client both start with [])
  const [items, setItems] = useState<CartItem[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const openDrawer = () => setIsDrawerOpen(true)
  const closeDrawer = () => setIsDrawerOpen(false)

  // Load cart from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window === 'undefined') return

    const currentVersion = String(CART_VERSION)
    const savedVersion = localStorage.getItem('healthplus_cart_version')

    if (savedVersion !== currentVersion) {
      // Version mismatch - clear old cart data to ensure fresh pricing
      localStorage.removeItem('healthplus_cart')
      localStorage.setItem('healthplus_cart_version', currentVersion)
      setIsInitialized(true)
      return
    }

    const savedCart = localStorage.getItem('healthplus_cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error)
        // Clear corrupted cart data
        localStorage.removeItem('healthplus_cart')
      }
    }
    setIsInitialized(true)
  }, [])

  // Save cart to localStorage whenever items change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('healthplus_cart', JSON.stringify(items))
    }
  }, [items, isInitialized])

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prevItems) => {
      // For membership items, only allow one membership at a time (replace existing)
      if (item.type === 'MEMBERSHIP' && item.membershipPlanId) {
        const existingMembershipIndex = prevItems.findIndex((i) => i.type === 'MEMBERSHIP')
        if (existingMembershipIndex !== -1) {
          const newItems = [...prevItems]
          newItems[existingMembershipIndex] = { ...item, quantity: 1 }
          return newItems
        }
        return [...prevItems, { ...item, quantity: 1 }]
      }

      const existingItem = prevItems.find((i) => {
        if (i.medicineId && i.medicineId === item.medicineId) return true
        if (i.productId && i.productId === item.productId) {
          if (item.variantId || i.variantId) {
            return i.variantId === item.variantId
          }
          return true
        }
        return false
      })
      if (existingItem) {
        return prevItems.map((i) => {
          const isMedicineMatch = i.medicineId && i.medicineId === item.medicineId
          const isProductMatch = i.productId && i.productId === item.productId
          const isVariantMatch = item.variantId || i.variantId 
            ? i.variantId === item.variantId 
            : true
          if (isMedicineMatch || (isProductMatch && isVariantMatch)) {
            return { ...i, quantity: i.quantity + (item.quantity || 1) }
          }
          return i
        })
      }
      return [...prevItems, { ...item, quantity: item.quantity || 1 }]
    })
  }

  const removeItem = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((i) => 
      i.medicineId !== itemId && i.productId !== itemId && i.membershipPlanId !== itemId
    ))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    setItems((prevItems) =>
      prevItems.map((i) => {
        if (i.membershipPlanId === itemId) {
          return { ...i, quantity: 1 }
        }
        if (i.medicineId === itemId || i.productId === itemId) {
          return { ...i, quantity }
        }
        return i
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        isInitialized,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
