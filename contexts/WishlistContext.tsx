'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface WishlistItem {
  id: string
  productId: string
  name: string
  slug: string
  price: number
  mrp: number | null
  imageUrl: string | null
  stockQuantity: number
  discountPercentage: number | null
  category: {
    id: string
    name: string
    slug: string
  }
  type: 'MEDICINE' | 'GENERAL'
  createdAt: string
}

interface WishlistContextType {
  items: WishlistItem[]
  productIds: Set<string>
  isLoading: boolean
  isInWishlist: (productId: string) => boolean
  addToWishlist: (productId: string) => Promise<boolean>
  removeFromWishlist: (productId: string) => Promise<boolean>
  toggleWishlist: (productId: string) => Promise<boolean>
  refetch: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [productIds, setProductIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set())

  const fetchWishlist = useCallback(async () => {
    if (status !== 'authenticated') {
      setItems([])
      setProductIds(new Set())
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/wishlist')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setProductIds(new Set(data.productIds || []))
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWishlist()
    } else if (status === 'unauthenticated') {
      setItems([])
      setProductIds(new Set())
    }
  }, [status, fetchWishlist])

  const isInWishlist = useCallback((productId: string) => {
    return productIds.has(productId)
  }, [productIds])

  const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (status !== 'authenticated') {
      toast.error('Wishlist use করতে লগইন করুন')
      return false
    }

    if (pendingOperations.has(productId)) {
      return false
    }

    setPendingOperations((prev) => new Set(prev).add(productId))
    setProductIds((prev) => new Set(prev).add(productId))

    try {
      const res = await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (!res.ok) {
        setProductIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
        toast.error('Wishlist এ যোগ করতে ব্যর্থ')
        return false
      }

      toast.success('Wishlist এ যোগ করা হয়েছে')
      fetchWishlist()
      return true
    } catch (error) {
      setProductIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
      toast.error('Wishlist এ যোগ করতে ব্যর্থ')
      return false
    } finally {
      setPendingOperations((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }, [status, pendingOperations, fetchWishlist])

  const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (status !== 'authenticated') {
      toast.error('Wishlist use করতে লগইন করুন')
      return false
    }

    if (pendingOperations.has(productId)) {
      return false
    }

    setPendingOperations((prev) => new Set(prev).add(productId))
    const previousProductIds = new Set(productIds)
    setProductIds((prev) => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
    setItems((prev) => prev.filter((item) => item.productId !== productId))

    try {
      const res = await fetch('/api/wishlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (!res.ok) {
        setProductIds(previousProductIds)
        fetchWishlist()
        toast.error('Wishlist থেকে সরাতে ব্যর্থ')
        return false
      }

      toast.success('Wishlist থেকে সরানো হয়েছে')
      return true
    } catch (error) {
      setProductIds(previousProductIds)
      fetchWishlist()
      toast.error('Wishlist থেকে সরাতে ব্যর্থ')
      return false
    } finally {
      setPendingOperations((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }, [status, pendingOperations, productIds, fetchWishlist])

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (isInWishlist(productId)) {
      return removeFromWishlist(productId)
    } else {
      return addToWishlist(productId)
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist])

  return (
    <WishlistContext.Provider
      value={{
        items,
        productIds,
        isLoading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refetch: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
