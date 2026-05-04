'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, User, Search, X, ChevronDown, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'
import { CartDrawer } from './CartDrawer'
import { MAIN_CONTAINER } from '@/lib/layout'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'

interface SearchSuggestion {
  id: string
  name: string
  imageUrl: string | null
  price: number
  manufacturer: string | null
  slug: string
  href: string
  sizeLabel: string | null
}

interface MedEasyHeaderProps {
  storeName?: string
}

export function MedEasyHeader({ storeName = 'HealthPlus' }: MedEasyHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { itemCount, openDrawer } = useCart()
  const { openModal } = useAuthModal()

  // Hide header on mobile for checkout, cart, order-success, and order tracking pages (they have their own headers)
  const hideOnMobile = pathname === '/checkout' || pathname === '/cart' || pathname === '/order-success' || pathname.startsWith('/orders/')
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debounce search query (300ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
    }, 300)
    return () => clearTimeout(handle)
  }, [searchQuery])

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    let cancelled = false

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
        const data = await res.json()
        if (!cancelled) {
          setSuggestions(data.items ?? [])
          setShowSuggestions(true)
        }
      } catch {
        if (!cancelled) {
          setSuggestions([])
        }
      } finally {
        if (!cancelled) setIsLoadingSuggestions(false)
      }
    }

    fetchSuggestions()
    return () => { cancelled = true }
  }, [debouncedQuery])

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle ESC key to close suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileSearchOpen(false)
      setShowSuggestions(false)
      setSearchQuery('')
    }
  }

  const handleSuggestionClick = () => {
    setShowSuggestions(false)
    setMobileSearchOpen(false)
    setSearchQuery('')
  }

  const profileHref = !session
    ? '/auth/signin'
    : session.user?.role === 'ADMIN'
      ? '/admin'
      : '/dashboard'

  const searchPlaceholder =
    isMedicineShopEnabled() && isGroceryShopEnabled()
      ? 'ওষুধ, স্বাস্থ্যপণ্য এবং আরো অনেক কিছু খুঁজুন...'
      : isMedicineShopEnabled()
        ? 'ওষুধ বা কসমেটিক্স খুঁজুন...'
        : isGroceryShopEnabled()
          ? 'কসমেটিক্স বা গ্রোসারি খুঁজুন...'
          : 'কসমেটিক্স ও পণ্য খুঁজুন...'

  return (
    <>
      <header className={`sticky top-0 z-50 w-full bg-teal-600 shadow-md ${hideOnMobile ? 'hidden lg:block' : ''}`}>
        {/* Centered container - uses shared MAIN_CONTAINER for consistent layout */}
        <div className={MAIN_CONTAINER}>
          <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
            {/* Logo */}
            <Link prefetch href="/" className="flex items-center gap-2 flex-shrink-0 group" aria-label="Halalzi — home">
              {/* Icon badge */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white transition-transform duration-200 group-hover:scale-105">
                <span className="text-lg font-bold text-teal-600">H</span>
              </div>

              {/* Brand name + tagline */}
              <div className="hidden sm:flex flex-col leading-none">
                <span
                  className="font-extrabold tracking-tight transition-opacity group-hover:opacity-90"
                  style={{ fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#ffffff' }}
                >
                  Halalzi
                  <span style={{ color: '#a7f3d0', fontWeight: 400, fontSize: '0.75rem', marginLeft: '2px' }}>.com</span>
                </span>
                <span className="text-[10px] text-teal-100 font-medium tracking-wide" style={{ marginTop: '1px' }}>
                  হালাল শপিং
                </span>
              </div>
            </Link>

            {/* Shortcut nav links - Desktop only */}
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
              {isMedicineShopEnabled() && (
                <>
                  <Link prefetch href="/medicines" className="px-3 py-1.5 text-[14px] text-white hover:underline transition-all">ঔষধ</Link>
                  <span className="text-white/40 text-sm">|</span>
                </>
              )}
              <Link prefetch href="/products?category=cosmetics" className="px-3 py-1.5 text-[14px] text-white hover:underline transition-all">কসমেটিক্স</Link>
              {isGroceryShopEnabled() && (
                <>
                  <span className="text-white/40 text-sm">|</span>
                  <Link
                    prefetch
                    href="/products?category=grocery"
                    className="px-3 py-1.5 text-[14px] text-white hover:underline transition-all"
                  >
                    গ্রোসারি
                  </Link>
                </>
              )}
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4" ref={searchContainerRef}>
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-full border-0 bg-white py-2.5 pl-5 pr-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-teal-600 p-2 text-white hover:bg-teal-700 transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>

                {/* Desktop Search Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-lg bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-50">
                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">Searching...</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto">
                        {suggestions.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={handleSuggestionClick}
                            prefetch={true}
                            className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-400 text-xs">No img</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.name}{item.sizeLabel ? ` ${item.sizeLabel}` : ''}</p>
                              {item.manufacturer && (
                                <p className="text-xs text-gray-500 truncate">{item.manufacturer}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-sm font-semibold text-teal-600">
                              ৳{item.price}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : debouncedQuery.length >= 1 ? (
                      <div className="py-4 text-center text-sm text-gray-500">
                        No products found
                      </div>
                    ) : null}
                  </div>
                )}
              </form>
            </div>

            {/* Mobile Search Bar - inline in header */}
            <div className="flex-1 md:hidden mx-2">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={() => setMobileSearchOpen(true)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-full border-0 bg-white/90 py-2 pl-4 pr-10 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                  readOnly
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Google Play Badge - Desktop Only */}
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get Halalzi on Google Play"
                className="hidden lg:flex items-center gap-2 rounded-xl px-3 py-1.5 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {/* Colorful Play Store icon */}
                <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z" fill="#EA4335"/>
                  <path d="M14.497 12.703l2.302 2.302-10.937 6.333 8.635-8.635z" fill="#FBBC04"/>
                  <path d="M17.696 9.505l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.49-2.495z" fill="#4285F4"/>
                  <path d="M5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" fill="#34A853"/>
                </svg>
                <div className="flex flex-col leading-tight">
                  <span className="text-[8px] uppercase tracking-wide text-gray-300">Get it on</span>
                  <span className="text-xs font-bold tracking-tight">Google Play</span>
                </div>
              </a>

              {/* Cart - Desktop only */}
              <button
                onClick={openDrawer}
                className="relative rounded-full p-2 text-white hover:bg-white/10 transition-colors hidden md:flex"
                aria-label={`Cart${mounted && itemCount > 0 ? ` (${itemCount} items)` : ''}`}
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>

              {/* User Menu - Desktop only */}
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1 rounded-full px-2 py-1.5 text-white hover:bg-white/10 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {mounted ? (session ? (session.user?.name?.split(' ')[0] || 'Account') : 'Sign In') : 'Sign In'}
                  </span>
                  <ChevronDown className="h-4 w-4 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black/5">
                    {session ? (
                      <>
                        <Link
                          prefetch
                          href={profileHref}
                          className="block px-4 py-2 text-sm font-medium text-teal-600 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {session.user?.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                        </Link>
                        <Link
                          prefetch
                          href="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          আমার অর্ডার
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            signOut({ callbackUrl: '/' })
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            openModal()
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign In
                        </button>
                        <Link
                          prefetch
                          href="/auth/signup"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-white md:hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          <div className="flex h-14 items-center gap-2 border-b px-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false)
                setShowSuggestions(false)
              }}
              aria-label="Close search"
              className="rounded-full p-3 -ml-1 text-gray-600 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
            <form onSubmit={handleSearch} className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full border-0 bg-transparent py-2 text-gray-900 placeholder-gray-500 focus:outline-none"
                autoFocus
              />
            </form>
            <button
              type="submit"
              onClick={handleSearch}
              aria-label="Submit search"
              className="rounded-full bg-teal-600 p-2 text-white"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Search Suggestions */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingSuggestions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div>
                {suggestions.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleSuggestionClick}
                    prefetch={true}
                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                  >
                    <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}{item.sizeLabel ? ` ${item.sizeLabel}` : ''}</p>
                      {item.manufacturer && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.manufacturer}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-sm font-semibold text-teal-600">
                      ৳{item.price}
                    </div>
                  </Link>
                ))}
              </div>
            ) : debouncedQuery.length >= 2 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No products found
              </div>
            ) : (
              <div className="p-4 text-center mt-4">
                <p className="text-sm text-gray-500">ওষুধ, স্বাস্থ্যপণ্য এবং আরো অনেক কিছু খুঁজুন...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  )
}
