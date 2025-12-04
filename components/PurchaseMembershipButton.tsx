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
  currentMembershipPlanId?: string
  currentMembershipEndDate?: string
}

export function PurchaseMembershipButton({
  planId,
  planName,
  planPrice,
  durationDays,
  ctaText,
  isHighlighted,
  currentMembershipPlanId,
  currentMembershipEndDate,
}: PurchaseMembershipButtonProps) {
  const { status } = useSession()
  const router = useRouter()
  const { addItem } = useCart()
  const [error, setError] = useState<string | null>(null)

  // Determine button action type
  const isSamePlan = currentMembershipPlanId === planId
  const hasMembership = !!currentMembershipPlanId

  // Determine button text
  let buttonText = ctaText
  let actionType: 'purchase' | 'renew' | 'upgrade' | 'downgrade' = 'purchase'
  
  if (hasMembership) {
    if (isSamePlan) {
      buttonText = 'রিনিউ করুন'
      actionType = 'renew'
    } else {
      // For simplicity, we'll call it "switch" - could be upgrade or downgrade
      buttonText = 'এই প্ল্যানে পরিবর্তন করুন'
      actionType = 'upgrade' // or downgrade, handled the same way
    }
  }

  const handleClick = async () => {
    setError(null)

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
      // Pass action type for the orders API to handle
    })

    router.push('/checkout')
  }

  // Format end date for display
  const endDateDisplay = currentMembershipEndDate 
    ? new Date(currentMembershipEndDate).toLocaleDateString('bn-BD', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null

  return (
    <>
      {hasMembership && isSamePlan && endDateDisplay && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          বর্তমান মেয়াদ: {endDateDisplay} পর্যন্ত
        </p>
      )}
      <button
        onClick={handleClick}
        className={`mt-2 block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white ${
          isHighlighted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'
        }`}
      >
        {buttonText}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </>
  )
}
