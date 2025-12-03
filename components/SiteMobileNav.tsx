'use client'

import { usePathname } from 'next/navigation'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export function SiteMobileNav() {
  const pathname = usePathname()

    // Hide mobile bottom nav on cart and checkout pages (they have their own sticky bars)
    if (pathname === '/cart' || pathname === '/checkout') {
      return null
    }

  return <MobileBottomNav />
}
