'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Calendar,
  Shield,
  FileText,
  Image,
  Users,
  BarChart3,
  MapPin,
  X,
  PackageCheck,
  Box,
  LayoutGrid,
  Sparkles,
  Settings,
  Upload,
  Factory,
  ShoppingCart,
  Lightbulb,
  ImageOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'AI Assistant', href: '/admin/ai-assistant', icon: Sparkles },
  { label: 'AI Import', href: '/admin/ai-import', icon: Upload },
  { label: 'Medicines', href: '/admin/medicines', icon: Package },
  { label: 'Products', href: '/admin/products', icon: Box },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Manufacturers', href: '/admin/manufacturers', icon: Factory },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: Calendar },
  { label: 'Subscription Plans', href: '/admin/subscription-plans', icon: PackageCheck },
  { label: 'Memberships', href: '/admin/memberships', icon: Shield },
  { label: 'Prescriptions', href: '/admin/prescriptions', icon: FileText },
  { label: 'Delivery Zones', href: '/admin/delivery-zones', icon: MapPin },
    { label: 'Home Sections', href: '/admin/home-sections', icon: LayoutGrid },
    { label: 'Banners', href: '/admin/banners', icon: Image },
    { label: 'Pages', href: '/admin/pages', icon: FileText },
        { label: 'Cart Settings', href: '/admin/cart-settings', icon: ShoppingCart },
        { label: 'Checkout Settings', href: '/admin/checkout-settings', icon: ShoppingBag },
        { label: 'Order Tracking Settings', href: '/admin/order-tracking-settings', icon: MapPin },
        { label: 'Cart Suggestions', href: '/admin/cart-suggestions', icon: Lightbulb },
        { label: 'Fix Images', href: '/admin/fix-images', icon: ImageOff },
        { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Sales / Reports', href: '/admin/sales', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo and close button */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white font-bold">
                H+
              </div>
              <span className="text-lg font-semibold text-gray-900">Admin</span>
            </Link>
            <button
              onClick={onClose}
              className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          onClose()
                        }
                      }}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600 pl-2'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', active ? 'text-teal-600' : 'text-gray-500')} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500">
              HealthPlus Admin Panel
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
