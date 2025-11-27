'use client'

import { usePathname } from 'next/navigation'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export function SiteMobileNav() {
  const pathname = usePathname()

  // Hide mobile bottom nav on cart page (cart has its own checkout bar)
  if (pathname === '/cart') {
    return null
  }

  return <MobileBottomNav />
}
