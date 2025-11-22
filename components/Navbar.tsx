'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserMenu } from './UserMenu'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  const isActive = (path: string) => pathname === path

  const profileHref = !session 
    ? '/auth/signin' 
    : session.user?.role === 'ADMIN' 
    ? '/admin' 
    : '/dashboard'

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600">
                <span className="text-xl font-bold text-white">H+</span>
              </div>
              <span className="text-xl font-bold text-teal-600">HealthPlus</span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-teal-600 ${
                isActive('/') ? 'text-teal-600' : 'text-gray-700'
              }`}
            >
              Home
            </Link>
            <Link
              href="/medicines"
              className={`text-sm font-medium transition-colors hover:text-teal-600 ${
                isActive('/medicines') ? 'text-teal-600' : 'text-gray-700'
              }`}
            >
              Medicines
            </Link>
            <Link
              href="/subscriptions"
              className={`text-sm font-medium transition-colors hover:text-teal-600 ${
                isActive('/subscriptions') ? 'text-teal-600' : 'text-gray-700'
              }`}
            >
              Subscriptions
            </Link>
            <Link
              href="/membership"
              className={`text-sm font-medium transition-colors hover:text-teal-600 ${
                isActive('/membership') ? 'text-teal-600' : 'text-gray-700'
              }`}
            >
              Membership
            </Link>
            <Link
              href="/cart"
              className="relative text-gray-700 transition-colors hover:text-teal-600"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">
                0
              </span>
            </Link>
            {session ? (
              <UserMenu variant="navbar" />
            ) : (
              <Link
                href="/auth/signin"
                className="text-gray-700 transition-colors hover:text-teal-600"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            <Link
              href="/"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/medicines"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Medicines
            </Link>
            <Link
              href="/subscriptions"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Subscriptions
            </Link>
            <Link
              href="/membership"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Membership
            </Link>
            <Link
              href="/cart"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cart
            </Link>
            <Link
              href={profileHref}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              {session?.user?.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
