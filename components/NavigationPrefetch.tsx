'use client'

/**
 * Warm common routes after first paint so many navigations hit prefetched RSC payloads.
 */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  GROCERY_CATEGORY_SLUG,
  isGroceryShopEnabled,
  isMedicineShopEnabled,
} from '@/lib/site-features'

const BASE_WARM_ROUTES = ['/', '/products', '/flash-sale', '/subscriptions', '/cart'] as const

export function NavigationPrefetch() {
  const router = useRouter()

  useEffect(() => {
    const warm = () => {
      BASE_WARM_ROUTES.forEach((href) => router.prefetch(href))
      if (isMedicineShopEnabled()) router.prefetch('/medicines')
      if (isGroceryShopEnabled()) router.prefetch(`/products?category=${GROCERY_CATEGORY_SLUG}`)
      router.prefetch('/products?category=cosmetics')
    }

    let idleCallbackId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleCallbackId = window.requestIdleCallback(() => warm(), { timeout: 2800 })
    } else {
      timeoutId = setTimeout(warm, 400)
    }

    return () => {
      if (idleCallbackId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleCallbackId)
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [router])

  return null
}
