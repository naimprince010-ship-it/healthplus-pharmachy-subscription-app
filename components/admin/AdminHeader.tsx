'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Menu, ExternalLink } from 'lucide-react'
import { UserMenu } from '@/components/UserMenu'

interface AdminHeaderProps {
  onMenuClick: () => void
  userName?: string
}

export function AdminHeader({ onMenuClick, userName }: AdminHeaderProps) {
  const pathname = usePathname()

  const parts = pathname.split('/').filter(Boolean)
  const breadcrumbParts = parts[0] === 'admin' ? parts.slice(1) : parts

  const formatLabel = (value: string) =>
    value
      .split('-')
      .filter(Boolean)
      .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
      .join(' ')

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

        {/* Center - Breadcrumb + welcome (hidden on mobile) */}
        <div className="hidden min-w-0 flex-1 md:block">
          <nav className="mb-1 flex items-center gap-1 overflow-hidden text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/admin" className="shrink-0 rounded px-1 py-0.5 hover:bg-gray-100 hover:text-gray-700">
              Admin
            </Link>

            {breadcrumbParts.map((part, index) => {
              const href = `/admin/${breadcrumbParts.slice(0, index + 1).join('/')}`
              const isLast = index === breadcrumbParts.length - 1

              return (
                <div key={`${href}-${index}`} className="flex min-w-0 items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  {isLast ? (
                    <span className="truncate font-medium text-gray-800">{formatLabel(part)}</span>
                  ) : (
                    <Link
                      href={href}
                      className="truncate rounded px-1 py-0.5 hover:bg-gray-100 hover:text-gray-700"
                    >
                      {formatLabel(part)}
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>

          {userName && (
            <p className="truncate text-xs text-gray-500">
              Welcome, <span className="font-medium text-gray-800">{userName}</span>
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
