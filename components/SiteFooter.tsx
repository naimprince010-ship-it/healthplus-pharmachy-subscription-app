'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/Footer'

export function SiteFooter() {
  const pathname = usePathname()

  // Hide footer on cart page
  if (pathname === '/cart') {
    return null
  }

  return <Footer />
}
