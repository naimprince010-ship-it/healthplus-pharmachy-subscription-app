'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionPlan, Zone } from '@prisma/client'
import { trackSubscribeStarted, trackSubscribeSuccess } from '@/lib/trackEvent'

interface SubscriptionFormProps {
  plan: SubscriptionPlan
  zones: Zone[]
}

export function SubscriptionForm({ plan, zones }: SubscriptionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    zoneId: '',
  })

  useEffect(() => {
    trackSubscribeStarted(plan.name, plan.priceMonthly)
  }, [plan.name, plan.priceMonthly])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      trackSubscribeSuccess(plan.name, plan.priceMonthly, data.subscription.id)

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mt-6 rounded-lg bg-green-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-green-900">Subscription Created!</h3>
        <p className="mt-2 text-sm text-green-700">
          Your subscription has been created successfully. Redirecting to dashboard...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone *
        </label>
        <input
          type="tel"
          id="phone"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Delivery Address *
        </label>
        <textarea
          id="address"
          required
          rows={3}
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div>
        <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
          Delivery Zone *
        </label>
        <select
          id="zoneId"
          required
          value={formData.zoneId}
          onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        >
          <option value="">Select a zone</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name} - ৳{zone.deliveryFee || zone.deliveryCharge} delivery
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Monthly Price:</span>
          <span className="font-semibold text-gray-900">৳{plan.priceMonthly}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
      >
        {loading ? 'Creating Subscription...' : 'Start Subscription'}
      </button>

      <p className="text-center text-xs text-gray-500">
        Payment will be collected on delivery (Cash on Delivery)
      </p>
    </form>
  )
}
