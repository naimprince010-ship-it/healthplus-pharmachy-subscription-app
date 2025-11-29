'use client'

import { useState, useEffect } from 'react'
import type { GdprSettings } from '@/lib/admin/settings'

interface CookieBannerProps {
  settings: GdprSettings
}

const COOKIE_CONSENT_KEY = 'cookieConsent'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

function getCookieConsent(): string | null {
  if (typeof window === 'undefined') return null
  const consent = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_CONSENT_KEY}=`))
  return consent?.split('=')[1] || null
}

function setCookieConsent(value: 'accepted' | 'declined') {
  document.cookie = `${COOKIE_CONSENT_KEY}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
  // Dispatch event so TrackingScripts can react
  window.dispatchEvent(new Event('cookieConsentChanged'))
}

export default function CookieBanner({ settings }: CookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Only show banner if enabled and no consent cookie exists
    if (settings.cookieBannerEnabled) {
      const consent = getCookieConsent()
      if (!consent) {
        setShowBanner(true)
      }
    }
  }, [settings.cookieBannerEnabled])

  const handleAccept = () => {
    setCookieConsent('accepted')
    setShowBanner(false)
  }

  const handleDecline = () => {
    setCookieConsent('declined')
    setShowBanner(false)
  }

  // Don't render on server or before mount
  if (!mounted) return null

  // Don't show if banner is disabled or already consented
  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm text-gray-700">
            {settings.cookieBannerText}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {settings.requireConsentForTracking && (
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
          )}
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
