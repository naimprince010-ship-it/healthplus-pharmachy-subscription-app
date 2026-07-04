'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
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
  Download,
  Factory,
  ShoppingCart,
  Lightbulb,
  ImageOff,
  Percent,
  BookOpen,
  Tag,
  List,
  AlertCircle,
  TrendingUp,
  Megaphone,
  Store,
  DollarSign,
  ShoppingBasket,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    id: 'core',
    title: 'Core',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'AI Assistant', href: '/admin/ai-assistant', icon: Sparkles },
      { label: 'Users', href: '/admin/users', icon: Users },
    ],
  },
  {
    id: 'catalog',
    title: 'Catalog',
    items: [
      { label: 'Medicines', href: '/admin/medicines', icon: Package },
      { label: 'Products', href: '/admin/products', icon: Box },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Manufacturers', href: '/admin/manufacturers', icon: Factory },
      { label: 'Missing Products', href: '/admin/missing-products', icon: AlertCircle },
      { label: 'Product Tagging', href: '/admin/product-tagging', icon: Tag },
      { label: 'Fix Images', href: '/admin/fix-images', icon: ImageOff },
    ],
  },
  {
    id: 'commerce',
    title: 'Commerce',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
      { label: 'Prescriptions', href: '/admin/prescriptions', icon: FileText },
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: Calendar },
      { label: 'Subscription Plans', href: '/admin/subscription-plans', icon: PackageCheck },
      { label: 'Subscription Page Copy', href: '/admin/subscription-plans/site-copy', icon: FileText },
      { label: 'Memberships', href: '/admin/memberships', icon: Shield },
      { label: 'Discount Manager', href: '/admin/discounts', icon: Percent },
      { label: 'Delivery Zones', href: '/admin/delivery-zones', icon: MapPin },
      { label: 'Cart Suggestions', href: '/admin/cart-suggestions', icon: Lightbulb },
    ],
  },
  {
    id: 'content-marketing',
    title: 'Content & Marketing',
    items: [
      { label: 'Home Sections', href: '/admin/home-sections', icon: LayoutGrid },
      { label: 'Banners', href: '/admin/banners', icon: Image },
      { label: 'Pages', href: '/admin/pages', icon: FileText },
      { label: 'Landing Pages', href: '/admin/landing-pages', icon: Megaphone },
      { label: 'Membership Page', href: '/admin/membership-settings', icon: Shield },
      { label: 'Membership Banner', href: '/admin/membership-banner', icon: Image },
      { label: 'Footer Settings', href: '/admin/footer-settings', icon: FileText },
      { label: 'Blog Topics', href: '/admin/blog-topics', icon: BookOpen },
      { label: 'Blog Queue', href: '/admin/blog-queue', icon: List },
      { label: 'Blog Sponsors', href: '/admin/blog-sponsors', icon: DollarSign },
    ],
  },
  {
    id: 'data-intelligence',
    title: 'Data & Intelligence',
    items: [
      { label: 'Local Traffic Analytics', href: '/admin/analytics', icon: MapPin },
      { label: 'Sales / Reports', href: '/admin/sales', icon: BarChart3 },
      { label: 'Market Intelligence', href: '/admin/market-intel', icon: TrendingUp },
      { label: 'Price Comparison', href: '/admin/market-intel/comparison', icon: BarChart3 },
      { label: 'Medex Scraper', href: '/admin/medex-scraper', icon: Sparkles },
    ],
  },
  {
    id: 'imports',
    title: 'Imports & Integrations',
    items: [
      { label: 'AI Import', href: '/admin/ai-import', icon: Upload },
      { label: 'Product Import', href: '/admin/product-import', icon: Download },
      { label: 'Chaldal Import', href: '/admin/chaldal-import', icon: ShoppingBasket },
      { label: 'Azan Wholesale', href: '/admin/azan-wholesale', icon: Store },
    ],
  },
  {
    id: 'system',
    title: 'System Settings',
    items: [
      { label: 'Cart Settings', href: '/admin/cart-settings', icon: ShoppingCart },
      { label: 'Checkout Settings', href: '/admin/checkout-settings', icon: ShoppingBag },
      { label: 'Order Tracking Settings', href: '/admin/order-tracking-settings', icon: MapPin },
      { label: 'Dashboard Settings', href: '/admin/dashboard-settings', icon: LayoutDashboard },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('admin-sidebar-collapsed')
      if (raw) {
        setCollapsedSections(JSON.parse(raw) as Record<string, boolean>)
      }
    } catch {
      setCollapsedSections({})
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsedSections))
    } catch {
      // Ignore storage errors silently.
    }
  }, [collapsedSections])
  const chaldalImportActive =
    pathname === '/admin/chaldal-import' ||
    (pathname.startsWith('/admin/product-import') && searchParams.get('from') === 'chaldal')

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    if (href === '/admin/chaldal-import') {
      return chaldalImportActive
    }
    if (href === '/admin/product-import') {
      return pathname.startsWith(href) && !chaldalImportActive
    }
    return pathname.startsWith(href)
  }

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return navSections
    }

    return navSections
      .map((section) => {
        const titleMatch = section.title.toLowerCase().includes(normalizedQuery)
        const items = titleMatch
          ? section.items
          : section.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery))

        return {
          ...section,
          items,
        }
      })
      .filter((section) => section.items.length > 0)
  }, [query])

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
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
            <div className="mb-4">
              <label htmlFor="admin-nav-search" className="sr-only">
                Search admin navigation
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="admin-nav-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            <div className="space-y-6">
              {filteredSections.map((section) => {
                const isCollapsed = query ? false : Boolean(collapsedSections[section.id])

                return (
                <section key={section.title}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="mb-2 flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    aria-expanded={!isCollapsed}
                    aria-controls={`admin-section-${section.id}`}
                  >
                    <span>{section.title}</span>
                    {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  <ul id={`admin-section-${section.id}`} className={cn('space-y-1', isCollapsed && 'hidden')}>
                    {section.items.map((item) => {
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
                </section>
                )
              })}

              {filteredSections.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500">
                  No matching page found.
                </p>
              )}
            </div>
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
