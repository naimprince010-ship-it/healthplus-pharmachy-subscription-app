'use client'

import Link from 'next/link'
import { Menu, ExternalLink } from 'lucide-react'
import { UserMenu } from '@/components/UserMenu'

interface AdminHeaderProps {
  onMenuClick: () => void
  userName?: string
}

export function AdminHeader({ onMenuClick, userName }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side - Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Center - Welcome message (hidden on mobile) */}
        <div className="hidden md:block">
          {userName && (
            <p className="text-sm text-gray-600">
              Welcome, <span className="font-medium text-gray-900">{userName}</span>
            </p>
          )}
        </div>

        {/* Right side - User menu and Visit site button */}
        <div className="ml-auto flex items-center space-x-3">
          <UserMenu userName={userName} variant="admin" />
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <span>Visit site</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
