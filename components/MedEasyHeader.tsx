'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, User, Search, X, ChevronDown, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'
import { CartDrawer } from './CartDrawer'
import { MAIN_CONTAINER } from '@/lib/layout'

interface SearchSuggestion {
  id: string
  name: string
  imageUrl: string | null
  price: number
  manufacturer: string | null
  slug: string
  href: string
}

interface MedEasyHeaderProps {
  storeName?: string
}

export function MedEasyHeader({ storeName = 'HealthPlus' }: MedEasyHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { itemCount, openDrawer } = useCart()
  
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
    if (!debouncedQuery || debouncedQuery.length < 2) {
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

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    router.push(suggestion.href)
    setShowSuggestions(false)
    setMobileSearchOpen(false)
    setSearchQuery('')
  }

  const profileHref = !session 
    ? '/auth/signin' 
    : session.user?.role === 'ADMIN' 
    ? '/admin' 
    : '/dashboard'

    return (
      <>
        <header className={`sticky top-0 z-50 w-full bg-teal-600 shadow-md ${hideOnMobile ? 'hidden lg:block' : ''}`}>
        {/* Centered container - uses shared MAIN_CONTAINER for consistent layout */}
        <div className={MAIN_CONTAINER}>
          <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                <span className="text-lg font-bold text-teal-600">H+</span>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">{storeName}</span>
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4" ref={searchContainerRef}>
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search medicines & products..."
                  className="w-full rounded-full border-0 bg-white py-2.5 pl-5 pr-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
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
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSuggestionClick(item)}
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
                              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                              {item.manufacturer && (
                                <p className="text-xs text-gray-500 truncate">{item.manufacturer}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-sm font-semibold text-teal-600">
                              ৳{item.price}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : debouncedQuery.length >= 2 ? (
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
                  placeholder="ওষুধ, ব্র্যান্ড বা লক্ষণ খুঁজুন"
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
                className="hidden lg:flex items-center gap-1 rounded-lg bg-black px-3 py-1.5 text-white hover:bg-gray-800 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                <div className="flex flex-col leading-tight">
                  <span className="text-[8px] uppercase">Get it on</span>
                  <span className="text-xs font-semibold">Google Play</span>
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
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
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
                                              href={profileHref}
                                              className="block px-4 py-2 text-sm font-medium text-teal-600 hover:bg-gray-100"
                                              onClick={() => setUserMenuOpen(false)}
                                            >
                                              {session.user?.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                                            </Link>
                                            <Link
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
                        <Link
                          href="/auth/signin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
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
        <div className="fixed inset-0 z-[60] bg-white md:hidden flex flex-col">
          <div className="flex h-14 items-center gap-2 border-b px-4 flex-shrink-0">
            <button
              onClick={() => {
                setMobileSearchOpen(false)
                setShowSuggestions(false)
              }}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <form onSubmit={handleSearch} className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search medicines & products..."
                className="w-full border-0 bg-transparent py-2 text-gray-900 placeholder-gray-500 focus:outline-none"
                autoFocus
              />
            </form>
            <button
              type="submit"
              onClick={handleSearch}
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
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
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
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                      {item.manufacturer && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.manufacturer}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-sm font-semibold text-teal-600">
                      ৳{item.price}
                    </div>
                  </button>
                ))}
              </div>
            ) : debouncedQuery.length >= 2 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No products found
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-500">Search for medicines, health products, and more...</p>
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
