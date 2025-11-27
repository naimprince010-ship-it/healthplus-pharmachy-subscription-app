'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/Footer'

export function SiteFooter() {
  const pathname = usePathname()

  // Hide footer on cart and checkout pages
  if (pathname === '/cart' || pathname === '/checkout') {
    return null
  }

  return <Footer />
}
