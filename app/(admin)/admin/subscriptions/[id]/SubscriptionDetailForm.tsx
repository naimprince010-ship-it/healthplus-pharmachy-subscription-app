'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Subscription, SubscriptionPlan, Zone } from '@prisma/client'

interface SubscriptionDetailFormProps {
  subscription: Subscription & {
    plan: SubscriptionPlan
    zone: Zone | null
  }
}

export function SubscriptionDetailForm({ subscription }: SubscriptionDetailFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    status: subscription.status,
    nextDelivery: new Date(subscription.nextDelivery).toISOString().split('T')[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          nextDelivery: new Date(formData.nextDelivery).toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription')
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">Subscription updated successfully!</p>
        </div>
      )}

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label htmlFor="nextDelivery" className="block text-sm font-medium text-gray-700">
          Next Delivery Date
        </label>
        <input
          type="date"
          id="nextDelivery"
          value={formData.nextDelivery}
          onChange={(e) => setFormData({ ...formData, nextDelivery: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
      >
        {loading ? 'Updating...' : 'Update Subscription'}
      </button>
    </form>
  )
}
