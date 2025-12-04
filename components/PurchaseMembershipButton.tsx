'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'

interface PurchaseMembershipButtonProps {
  planId: string
  ctaText: string
  isHighlighted?: boolean
}

export function PurchaseMembershipButton({
  planId,
  ctaText,
  isHighlighted,
}: PurchaseMembershipButtonProps) {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setError(null)

    if (status === 'unauthenticated') {
      await signIn(undefined, { callbackUrl: '/membership' })
      return
    }

    if (status !== 'authenticated') return

    setLoading(true)
    try {
      const res = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to purchase membership')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white ${
          isHighlighted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'
        } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Processing...' : ctaText}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </>
  )
}
