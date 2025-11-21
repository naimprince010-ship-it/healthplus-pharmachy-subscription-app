'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  id: string
  medicineId: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (medicineId: string) => void
  updateQuantity: (medicineId: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('healthplus_cart')
      if (savedCart) {
        try {
          return JSON.parse(savedCart)
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error)
        }
      }
    }
    return []
  })
  useEffect(() => {
    localStorage.setItem('healthplus_cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.medicineId === item.medicineId)
      if (existingItem) {
        return prevItems.map((i) =>
          i.medicineId === item.medicineId
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        )
      }
      return [...prevItems, { ...item, quantity: item.quantity || 1 }]
    })
  }

  const removeItem = (medicineId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.medicineId !== medicineId))
  }

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(medicineId)
      return
    }
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.medicineId === medicineId ? { ...i, quantity } : i
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
