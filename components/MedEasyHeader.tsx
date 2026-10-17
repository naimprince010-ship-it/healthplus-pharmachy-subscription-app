'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, User, Search, X, ChevronDown, Loader2, MapPin, MessageCircle } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'
import { CartDrawer } from './CartDrawer'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'
import { trackWhatsAppClick } from '@/lib/trackEvent'

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
  freeDeliveryThreshold?: number | null
  whatsappNumber?: string
}

export function MedEasyHeader({ storeName = 'HealthPlus', freeDeliveryThreshold = null, whatsappNumber = '' }: MedEasyHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { itemCount, total, isInitialized, openDrawer } = useCart()
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
      ? 'কসমেটিক্স বা গ্রোসারি খুঁজুন...'
      : isMedicineShopEnabled()
        ? 'কসমেটিক্স ও বিউটি পণ্য খুঁজুন...'
        : isGroceryShopEnabled()
          ? 'কসমেটিক্স বা গ্রোসারি খুঁজুন...'
          : 'কসমেটিক্স ও পণ্য খুঁজুন...'
  const cleanWhatsApp = whatsappNumber.replace(/\D/g, '')
  const hasDeliveryProgress = mounted && isInitialized && Boolean(freeDeliveryThreshold && freeDeliveryThreshold > 0) && total > 0
  const deliveryRemaining = freeDeliveryThreshold ? Math.max(0, freeDeliveryThreshold - total) : 0
  const deliveryProgress = freeDeliveryThreshold ? Math.min(100, (total / freeDeliveryThreshold) * 100) : 0
  const headerContainer = 'mx-auto w-full max-w-[1320px] px-3 sm:px-4 lg:px-6'

  return (
    <>
      <header className={`sticky top-0 z-50 w-full bg-[#0B4F4A] shadow-sm md:bg-white ${hideOnMobile ? 'hidden lg:block' : ''}`}>
        <div className="hidden bg-[#0B4F4A] text-[13px] text-white lg:block">
          <div className={`${headerContainer} grid h-9 grid-cols-3 items-center`}>
            <span>ডেলিভারি: ঢাকা</span>
            <div className="flex min-w-0 items-center justify-center gap-2 text-center" aria-live="polite">
              <span className="truncate">
                {hasDeliveryProgress
                  ? deliveryRemaining > 0
                    ? `আর ৳${Math.ceil(deliveryRemaining)} কিনলেই ফ্রি ডেলিভারি`
                    : 'ফ্রি ডেলিভারি পেয়েছেন!'
                  : `${freeDeliveryThreshold ? `৳${freeDeliveryThreshold}+ অর্ডারে ফ্রি ডেলিভারি · ` : ''}ক্যাশ অন ডেলিভারি`}
              </span>
              {hasDeliveryProgress && (
                <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-white/25" aria-label="ফ্রি ডেলিভারি প্রগ্রেস">
                  <span className="block h-full rounded-full bg-[#F59E0B] transition-[width] duration-300" style={{ width: `${deliveryProgress}%` }} />
                </span>
              )}
            </div>
            <Link href="/orders" className="inline-flex min-h-11 items-center justify-end text-right font-semibold hover:underline">অর্ডার ট্র্যাক করুন</Link>
          </div>
        </div>
        <div className={headerContainer}>
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 py-2 md:hidden">
            <div className="flex min-h-11 items-center gap-2">
              <Link href="/" className="flex min-h-11 items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-teal-600">H</span>
              <strong className="block text-base text-white">Halalzi.com</strong>
              </Link>
              <span className="flex items-center gap-1 text-[11px] text-teal-50"><MapPin className="h-3 w-3" />ডেলিভারি: ঢাকা</span>
            </div>
            {cleanWhatsApp && <a href={`https://api.whatsapp.com/send?phone=${cleanWhatsApp}`} target="_blank" rel="noreferrer" onClick={() => trackWhatsAppClick('header_mobile')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/70 px-3 text-xs font-bold text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
          </div>
          <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4 lg:h-[72px]">
            {/* Logo */}
            <Link prefetch href="/" className="hidden min-h-11 items-center gap-2 flex-shrink-0 group md:flex">
              {/* Icon badge */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E] transition-transform duration-200 group-hover:scale-105">
                <span className="text-lg font-bold text-white">H</span>
              </div>

              {/* Brand name + tagline */}
              <div className="hidden sm:flex flex-col leading-none">
                <span
                  className="font-extrabold tracking-tight transition-opacity group-hover:opacity-90"
                  style={{ fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#173F3B' }}
                >
                  Halalzi
                  <span style={{ color: '#0F766E', fontWeight: 500, fontSize: '0.75rem', marginLeft: '2px' }}>.com</span>
                </span>
                <span className="text-[10px] font-medium tracking-wide text-slate-500" style={{ marginTop: '1px' }}>
                  বিউটি ও দৈনন্দিন বাজার
                </span>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <div className="mx-4 hidden max-w-[680px] flex-1 md:flex" ref={searchContainerRef}>
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={searchPlaceholder}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-5 pr-12 text-gray-900 placeholder-gray-500 focus:border-[#0F766E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-[#0F766E] text-white transition-colors hover:bg-[#0B4F4A]"
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
                  placeholder="কসমেটিক্স, গ্রোসারি বা ব্র্যান্ড খুঁজুন"
                  className="h-12 w-full rounded-full border-0 bg-white/90 px-4 pr-10 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                  readOnly
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {cleanWhatsApp && <a href={`https://api.whatsapp.com/send?phone=${cleanWhatsApp}`} target="_blank" rel="noreferrer" onClick={() => trackWhatsAppClick('header_desktop')} className="hidden min-h-11 items-center gap-2 rounded-xl border border-[#0F766E] px-3 text-sm font-bold text-[#0F766E] transition hover:bg-teal-50 md:inline-flex"><MessageCircle className="h-4 w-4" />WhatsApp-এ অর্ডার</a>}
              {/* Cart - Desktop only */}
              <button
                onClick={openDrawer}
                className="relative hidden h-11 w-11 items-center justify-center rounded-full text-[#0B4F4A] transition-colors hover:bg-teal-50 md:flex"
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
                  className="flex min-h-11 items-center gap-1 rounded-full px-2 py-1.5 text-[#173F3B] transition-colors hover:bg-teal-50"
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
              className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
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
              className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white"
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
              <div className="p-4">
                <p className="text-sm text-gray-500">কসমেটিক্স, গ্রোসারি ও দৈনন্দিন পণ্য খুঁজুন...</p>
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
