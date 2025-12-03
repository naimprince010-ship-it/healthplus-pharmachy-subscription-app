'use client'

import { usePathname } from 'next/navigation'

interface SiteFooterWrapperProps {
  children: React.ReactNode
}

export function SiteFooterWrapper({ children }: SiteFooterWrapperProps) {
  const pathname = usePathname()

  // Hide footer on cart, checkout, order-success, and order tracking pages (they have their own UI)
  if (pathname === '/cart' || pathname === '/checkout' || pathname === '/order-success' || pathname.startsWith('/orders/')) {
    return null
  }

  return <>{children}</>
}
