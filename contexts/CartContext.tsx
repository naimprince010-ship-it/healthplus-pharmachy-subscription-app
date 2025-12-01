'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Cart version - increment this when cart structure changes or pricing updates require clearing old carts
// Version 3: Ensure mrp field is properly stored for flash-sale products
const CART_VERSION = 3

export interface CartItem {
  id: string
  medicineId?: string
  productId?: string
  variantId?: string
  variantLabel?: string
  name: string
  price: number
  quantity: number
  image?: string
  type: 'MEDICINE' | 'PRODUCT'
  category?: string
  genericName?: string
  mrp?: number
  slug?: string
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
      i.medicineId !== itemId && i.productId !== itemId
    ))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    setItems((prevItems) =>
      prevItems.map((i) =>
        (i.medicineId === itemId || i.productId === itemId) ? { ...i, quantity } : i
      )
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
