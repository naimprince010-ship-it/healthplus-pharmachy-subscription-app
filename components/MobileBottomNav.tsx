'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Calendar, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Shop', icon: Package },
    { href: '/subscriptions', label: 'Plans', icon: Calendar },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, badge: itemCount },
    { href: '/dashboard', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center justify-center py-2 text-xs transition-colors ${
                isActive
                  ? 'text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
