'use client'

import { usePathname } from 'next/navigation'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export function SiteMobileNav() {
  const pathname = usePathname()

    // Hide mobile bottom nav on cart, checkout, order-success, and order tracking pages (they have their own UI)
    if (pathname === '/cart' || pathname === '/checkout' || pathname === '/order-success' || pathname.startsWith('/orders/')) {
      return null
    }

  return <MobileBottomNav />
}
