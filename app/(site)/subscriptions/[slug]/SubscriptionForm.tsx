'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionPlan, Zone } from '@prisma/client'
import { trackSubscribeStarted, trackSubscribeSuccess } from '@/lib/trackEvent'

interface SubscriptionFormProps {
  plan: SubscriptionPlan
  zones: Zone[]
  initialName?: string
  initialPhone?: string
}

export function SubscriptionForm({ plan, zones, initialName = '', initialPhone = '' }: SubscriptionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    fullName: initialName.trim(),
    phone: initialPhone.trim(),
    address: '',
    zoneId: '',
    subscriberNotes: '',
  })

  useEffect(() => {
    trackSubscribeStarted(plan.name, plan.priceMonthly)
  }, [plan.name, plan.priceMonthly])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      fullName: initialName.trim() || prev.fullName,
      phone: initialPhone.trim() || prev.phone,
    }))
  }, [initialName, initialPhone])

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
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          zoneId: formData.zoneId,
          subscriberNotes: formData.subscriberNotes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'সাবস্ক্রিপশন তৈরি সম্ভব হয়নি')
      }

      trackSubscribeSuccess(
        plan.name,
        plan.priceMonthly,
        String(data.subscription?.id ?? '')
      )

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'একটি ত্রুটি হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mt-6 rounded-lg bg-green-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-green-900">সাবস্ক্রিপশন নিবন্ধিত হয়েছে</h3>
        <p className="mt-2 text-sm text-green-700">কয়েক মুহূর্তে ড্যাশবোর্ডে নিয়ে যাওয়া হবে…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {error ? (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : null}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          পূর্ণ নাম *
        </label>
        <input
          type="text"
          id="fullName"
          required
          autoComplete="name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          মোবাইল নম্বর *
        </label>
        <input
          type="tel"
          id="phone"
          required
          autoComplete="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          ডেলিভারি ঠিকানা *
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
          ডেলিভারি এলাকা *
        </label>
        <select
          id="zoneId"
          required
          value={formData.zoneId}
          onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        >
          <option value="">একটি এলাকা বেছে নিন</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
              {' — '}
              ৳{zone.deliveryFee ?? Math.round(zone.deliveryCharge)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="subscriberNotes" className="block text-sm font-medium text-gray-700">
          ডেলিভারির সম্পর্কে নোট <span className="font-normal text-gray-400">(ঐচ্ছিক)</span>
        </label>
        <p className="text-xs text-gray-500">উদাহরণ: মাসের ৫ তারিখের পর পছন্দ, অফিসের সময়, গেট নম্বর</p>
        <textarea
          id="subscriberNotes"
          rows={2}
          value={formData.subscriberNotes}
          onChange={(e) => setFormData({ ...formData, subscriberNotes: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div className="rounded-lg bg-teal-50/60 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">মাসিক মূল্য</span>
          <span className="font-semibold text-gray-900">৳{plan.priceMonthly.toLocaleString('en-BD')}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
      >
        {loading ? 'প্রসেস করা হচ্ছে…' : 'সাবস্ক্রাইব নিশ্চিত করুন'}
      </button>

      <p className="text-center text-xs text-gray-500">
        পেমেন্ট ডেলিভারির সময় নগদ গ্রহণ (COD), যদি না করে অন্যথায় জানানো হয়।
      </p>
    </form>
  )
}
