'use client'

import { usePWA } from './PWAProvider'
import { X, Share, Plus, Download } from 'lucide-react'

export function InstallPrompt() {
  const { showInstallPrompt, isIOS, isInstallable, promptInstall, dismissInstallPrompt, isStandalone } = usePWA()

  if (!showInstallPrompt || isStandalone) {
    return null
  }

  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg animate-slide-up md:bottom-4 md:left-4 md:right-auto md:w-80 md:rounded-lg md:border">
        <button
          onClick={dismissInstallPrompt}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-start gap-3 pr-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">H+</span>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">Install Halalzi App</h3>
            <p className="text-xs text-gray-500 mt-1">
              Add to your home screen for quick access
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">To install:</p>
          <ol className="text-xs text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-medium">1</span>
              <span>Tap the <Share className="inline w-4 h-4 text-blue-500" /> Share button</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-medium">2</span>
              <span>Scroll and tap <Plus className="inline w-4 h-4" /> &quot;Add to Home Screen&quot;</span>
            </li>
          </ol>
        </div>
        
        <button
          onClick={dismissInstallPrompt}
          className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Maybe later
        </button>
      </div>
    )
  }

  if (!isInstallable) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg animate-slide-up md:bottom-4 md:left-4 md:right-auto md:w-80 md:rounded-lg md:border">
      <button
        onClick={dismissInstallPrompt}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">H+</span>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">Install Halalzi App</h3>
          <p className="text-xs text-gray-500 mt-1">
            Get quick access from your home screen
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={promptInstall}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
        <button
          onClick={dismissInstallPrompt}
          className="py-2.5 px-4 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
