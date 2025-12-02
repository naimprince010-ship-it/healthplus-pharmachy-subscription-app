'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'

interface PWAContextType {
  isInstalled: boolean
  isInstallable: boolean
  isIOS: boolean
  isStandalone: boolean
  promptInstall: () => Promise<void>
  dismissInstallPrompt: () => void
  showInstallPrompt: boolean
}

const PWAContext = createContext<PWAContextType | null>(null)

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(isIOSDevice)

    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(isStandaloneMode)
    setIsInstalled(isStandaloneMode)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered:', registration.scope)
      }).catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      
      if (!isStandaloneMode && daysSinceDismissed > 7) {
        setTimeout(() => setShowInstallPrompt(true), 3000)
      }
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (isIOSDevice && !isStandaloneMode) {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      
      if (daysSinceDismissed > 7) {
        setTimeout(() => setShowInstallPrompt(true), 5000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isInstallable,
        isIOS,
        isStandalone,
        promptInstall,
        dismissInstallPrompt,
        showInstallPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}
