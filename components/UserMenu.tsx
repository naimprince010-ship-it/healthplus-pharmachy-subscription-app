'use client'

import { useState, useRef, useEffect } from 'react'
import { User, LogOut, UserCircle, ChevronDown } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

interface UserMenuProps {
  userName?: string
  variant?: 'navbar' | 'admin'
}

export function UserMenu({ userName, variant = 'navbar' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  const displayName = userName || session?.user?.name || 'User'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (variant === 'navbar') {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 text-gray-700 transition-colors hover:text-teal-600"
          aria-label="User menu"
        >
          <User className="h-5 w-5" />
          <ChevronDown className="h-3 w-3" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            <Link
              href={session?.user?.role === 'ADMIN' ? '/admin' : '/dashboard'}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <UserCircle className="h-4 w-4" />
              <span>{session?.user?.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        aria-label="User menu"
      >
        <User className="h-5 w-5" />
        <span className="hidden md:inline">{displayName}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
          <Link
            href="/admin"
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
          >
            <UserCircle className="h-4 w-4" />
            <span>Profile</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}
