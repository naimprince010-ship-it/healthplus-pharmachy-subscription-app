'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, User, Search, X, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'

export function MedEasyHeader() {
  const router = useRouter()
  const { data: session } = useSession()
  const { itemCount } = useCart()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileSearchOpen(false)
    }
  }

  const profileHref = !session 
    ? '/auth/signin' 
    : session.user?.role === 'ADMIN' 
    ? '/admin' 
    : '/dashboard'

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#0d6efd] shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                <span className="text-lg font-bold text-[#0d6efd]">H+</span>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">HealthPlus</span>
            </Link>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medicines & products..."
                  className="w-full rounded-full border-0 bg-white py-2.5 pl-5 pr-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-[#0d6efd] p-2 text-white hover:bg-[#0b5ed7] transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Search Icon */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="md:hidden rounded-full p-2 text-white hover:bg-white/10 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

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

              {/* Cart */}
              <Link
                href="/cart"
                className="relative rounded-full p-2 text-white hover:bg-white/10 transition-colors"
                aria-label={`Cart${mounted && itemCount > 0 ? ` (${itemCount} items)` : ''}`}
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 rounded-full px-2 py-1.5 text-white hover:bg-white/10 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {session ? (session.user?.name?.split(' ')[0] || 'Account') : 'Sign In'}
                  </span>
                  <ChevronDown className="h-4 w-4 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black/5">
                    {session ? (
                      <>
                        <Link
                          href={profileHref}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {session.user?.role === 'ADMIN' ? 'Admin Panel' : 'My Dashboard'}
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Orders
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
        <div className="fixed inset-0 z-[60] bg-white md:hidden">
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <form onSubmit={handleSearch} className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicines & products..."
                className="w-full border-0 bg-transparent py-2 text-gray-900 placeholder-gray-500 focus:outline-none"
                autoFocus
              />
            </form>
            <button
              type="submit"
              onClick={handleSearch}
              className="rounded-full bg-[#0d6efd] p-2 text-white"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">Search for medicines, health products, and more...</p>
          </div>
        </div>
      )}
    </>
  )
}
