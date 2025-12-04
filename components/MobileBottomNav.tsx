'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  const navItems = [
    { href: '/', label: 'Home', iconType: 'home' },
    { href: '/products', label: 'Shop', iconType: 'shop' },
    { href: '/subscriptions', label: 'Plans', iconType: 'plans' },
    { href: '/cart', label: 'Cart', iconType: 'cart', badge: itemCount },
    { href: '/dashboard', label: 'Profile', iconType: 'profile' },
  ]

  const renderIcon = (iconType: string, isActive: boolean) => {
    const color = isActive ? '#0d9488' : '#6b7280'
    
    switch (iconType) {
      case 'home':
        return (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill={isActive ? color : 'none'} stroke={color} strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'shop':
        return (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'plans':
        return (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'cart':
        return (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="9" cy="21" r="1" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="20" cy="21" r="1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'profile':
        return (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center justify-center py-2 text-xs transition-all duration-100 active:scale-95 active:opacity-70 ${
                isActive
                  ? 'text-teal-600'
                  : 'text-gray-500 hover:text-teal-600'
              }`}
            >
              <div className="relative">
                {renderIcon(item.iconType, isActive)}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
