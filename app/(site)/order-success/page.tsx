'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Info } from 'lucide-react'

interface CheckoutSettings {
  successPageTitleBn: string
  successLine1Bn: string
  successLine2Bn: string
  orderIdLabelBn: string
  successTotalLabelBn: string
  successPaymentLabelBn: string
  infoNoteBn: string
  trackOrderButtonBn: string
  goHomeButtonBn: string
  codLabelBn: string
  bkashLabelBn: string
}

const DEFAULT_SETTINGS: CheckoutSettings = {
  successPageTitleBn: 'অর্ডার কনফার্মেশন',
  successLine1Bn: 'ধন্যবাদ! আপনার অর্ডারটি',
  successLine2Bn: 'সফলভাবে প্লেস করা হয়েছে 🎉',
  orderIdLabelBn: 'অর্ডার আইডি:',
  successTotalLabelBn: 'সর্বমোট:',
  successPaymentLabelBn: 'পেমেন্ট মেথড:',
  infoNoteBn: 'আমাদের একজন ফার্মাসিস্ট শীঘ্রই আপনাকে ফোন করে অর্ডারটি কনফার্ম করবেন।',
  trackOrderButtonBn: 'অর্ডার ট্র্যাক করুন',
  goHomeButtonBn: 'হোম পেজে যান',
  codLabelBn: 'ক্যাশ অন ডেলিভারি',
  bkashLabelBn: 'বিকাশ / নগদ',
}

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<CheckoutSettings>(DEFAULT_SETTINGS)

  const orderId = searchParams.get('orderId') || ''
  const amount = searchParams.get('amount') || '0'
  const paymentMethod = searchParams.get('paymentMethod') || 'COD'

  useEffect(() => {
    setMounted(true)

    // Fetch checkout settings
    fetch('/api/checkout/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
        }
      })
      .catch((err) => console.error('Failed to fetch settings:', err))

    // Replace history to prevent going back to checkout
    // This ensures pressing back button goes to home instead of checkout
    window.history.replaceState(null, '', window.location.href)
    
    // Push home to history so back button goes to home
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      // When user presses back, redirect to home
      router.replace('/')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])

  // Format order ID for display (e.g., ORD-9823)
  const displayOrderId = orderId.startsWith('ORD-') 
    ? orderId 
    : `ORD-${orderId.slice(-4).toUpperCase()}`

  // Format payment method for display
  const paymentMethodDisplay = paymentMethod === 'BKASH' 
    ? settings.bkashLabelBn 
    : settings.codLabelBn

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">
            <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto mb-6" />
            <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-4" />
            <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">{settings.successPageTitleBn}</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-900">{settings.successPageTitleBn}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 lg:max-w-4xl lg:mx-auto">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-[#00A651] flex items-center justify-center shadow-lg">
              <Check className="h-14 w-14 text-white stroke-[3]" />
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-[#00A651]/30 animate-ping" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#00A651] mb-2">
            {settings.successLine1Bn}
          </h2>
          <h2 className="text-2xl font-bold text-[#00A651] mb-4">
            {settings.successLine2Bn}
          </h2>
          <p className="text-gray-600 text-lg">
            {settings.orderIdLabelBn} <span className="font-semibold text-gray-900">#{displayOrderId}</span>
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">{settings.successTotalLabelBn}</span>
              <span className="text-xl font-bold text-gray-900">৳{parseInt(amount).toLocaleString('bn-BD')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">{settings.successPaymentLabelBn}</span>
              <span className="font-semibold text-gray-900">{paymentMethodDisplay}</span>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 rounded-xl p-4 mb-8 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {settings.infoNoteBn}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Button - Track Order */}
          <Link
            href={`/orders/${orderId}`}
            className="flex w-full items-center justify-center rounded-xl bg-[#00A651] py-4 font-semibold text-white text-lg hover:bg-[#008f45] transition-colors"
          >
            {settings.trackOrderButtonBn}
          </Link>

          {/* Secondary Button - Continue Shopping */}
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-xl border-2 border-[#00A651] bg-white py-4 font-semibold text-[#00A651] text-lg hover:bg-[#00A651]/5 transition-colors"
          >
            {settings.goHomeButtonBn}
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto mb-6" />
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessContent />
    </Suspense>
  )
}
