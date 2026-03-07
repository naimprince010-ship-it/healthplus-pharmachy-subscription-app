'use client'

import { MessageCircle } from 'lucide-react'
import { trackWhatsAppClick } from '@/lib/trackEvent'

interface WhatsAppButtonProps {
  phone?: string
  message?: string
}

export function WhatsAppButton({
  phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  message = 'Hello! I need help with HealthPlus.'
}: WhatsAppButtonProps) {
  const handleClick = () => {
    trackWhatsAppClick('floating_button')

    // Clean phone number: remove all non-numeric characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '')

    if (!cleanPhone) {
      console.warn('WhatsApp phone number is missing')
      return
    }

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600 lg:bottom-6"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  )
}
