'use client'

import { usePathname } from 'next/navigation'

interface SiteFooterWrapperProps {
  children: React.ReactNode
}

export function SiteFooterWrapper({ children }: SiteFooterWrapperProps) {
  const pathname = usePathname()

  // Hide footer on cart and checkout pages (they have their own sticky bars)
  if (pathname === '/cart' || pathname === '/checkout') {
    return null
  }

  return <>{children}</>
}
