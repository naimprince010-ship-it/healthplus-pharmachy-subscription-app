'use client'

import Link from 'next/link'
import { trackSubscribeClick } from '@/lib/trackEvent'

interface SubscriptionCardProps {
  slug: string
  name: string
  price: number
  children: React.ReactNode
}

export function SubscriptionCard({ slug, name, price, children }: SubscriptionCardProps) {
  const handleClick = () => {
    trackSubscribeClick(name, price)
  }

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-transform hover:scale-105">
      {children}
      <Link
        href={`/subscriptions/${slug}`}
        onClick={handleClick}
        className="mt-8 block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white transition-colors hover:bg-teal-700"
      >
        Subscribe Now
      </Link>
    </div>
  )
}
