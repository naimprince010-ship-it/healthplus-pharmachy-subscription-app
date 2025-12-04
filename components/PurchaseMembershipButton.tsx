'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'

interface PurchaseMembershipButtonProps {
  planId: string
  planName: string
  planPrice: number
  durationDays: number
  ctaText: string
  isHighlighted?: boolean
  hasActiveMembership?: boolean
}

export function PurchaseMembershipButton({
  planId,
  planName,
  planPrice,
  durationDays,
  ctaText,
  isHighlighted,
  hasActiveMembership,
}: PurchaseMembershipButtonProps) {
  const { status } = useSession()
  const router = useRouter()
  const { addItem } = useCart()
  const [error, setError] = useState<string | null>(null)

  const isDisabled = !!hasActiveMembership

  const handleClick = async () => {
    setError(null)

    if (hasActiveMembership) {
      return
    }

    if (status === 'unauthenticated') {
      await signIn(undefined, { callbackUrl: '/membership' })
      return
    }

    if (status !== 'authenticated') return

    addItem({
      id: `membership-${planId}`,
      membershipPlanId: planId,
      name: planName,
      price: planPrice,
      type: 'MEMBERSHIP',
      durationDays,
    })

    router.push('/checkout')
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white ${
          isHighlighted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'
        } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {hasActiveMembership ? 'আপনার মেম্বারশিপ আছে' : ctaText}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </>
  )
}
