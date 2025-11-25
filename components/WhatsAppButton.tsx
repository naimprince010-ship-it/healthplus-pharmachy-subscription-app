'use client'

import { MessageCircle } from 'lucide-react'
import { trackWhatsAppClick } from '@/lib/trackEvent'

export function WhatsAppButton() {
  const handleClick = () => {
    trackWhatsAppClick('floating_button')
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8801XXXXXXXXX'
    const message = encodeURIComponent('Hello! I need help with HealthPlus.')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  )
}
