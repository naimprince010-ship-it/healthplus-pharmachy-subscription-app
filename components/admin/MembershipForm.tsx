'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface MembershipPlan {
  id: string
  name: string
  description?: string | null
  price: number
  originalPrice?: number | null
  durationDays: number
  discountPercent: number
  badge?: string | null
  benefitsJson?: string[] | null
  ctaText?: string | null
  isHighlighted?: boolean
  sortOrder?: number | null
  isActive: boolean
}

interface MembershipFormProps {
  plan?: MembershipPlan
}

export default function MembershipForm({ plan }: MembershipFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    price: plan?.price || 0,
    originalPrice: plan?.originalPrice || '',
    durationDays: plan?.durationDays || 30,
    discountPercent: plan?.discountPercent || 0,
    badge: plan?.badge || '',
    benefitsText: (plan?.benefitsJson || []).join('\n'),
    ctaText: plan?.ctaText || '',
    isHighlighted: plan?.isHighlighted ?? false,
    sortOrder: plan?.sortOrder ?? '',
    isActive: plan?.isActive ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = plan
        ? `/api/admin/memberships/${plan.id}`
        : '/api/admin/memberships'

      const method = plan ? 'PUT' : 'POST'

      const benefitsArray = formData.benefitsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          originalPrice: formData.originalPrice ? parseFloat(String(formData.originalPrice)) : null,
          durationDays: formData.durationDays,
          discountPercent: formData.discountPercent,
          badge: formData.badge || null,
          benefitsJson: benefitsArray.length > 0 ? benefitsArray : null,
          ctaText: formData.ctaText || null,
          isHighlighted: formData.isHighlighted,
          sortOrder: formData.sortOrder !== '' ? parseInt(String(formData.sortOrder)) : null,
          isActive: formData.isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save membership plan')
        setIsSubmitting(false)
        return
      }

      router.push('/admin/memberships')
      router.refresh()
    } catch (err) {
      console.error('Error saving membership plan:', err)
      setError('Failed to save membership plan')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <Link
        href="/admin/memberships"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Membership Plans
      </Link>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Plan Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="e.g., Monthly Premium"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Describe the benefits of this membership plan"
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price (৳) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            The price customers will pay for this membership
          </p>
        </div>

        {/* Original Price (for anchor pricing) */}
        <div>
          <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">
            Original Price (৳) - আসল দাম
          </label>
          <input
            type="number"
            id="originalPrice"
            value={formData.originalPrice}
            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Anchor pricing - shows crossed out original price (e.g., ৳২০০ → ৳১০০)
          </p>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700">
            Duration (Days) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="durationDays"
            value={formData.durationDays}
            onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
            required
            min="1"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            How long the membership will be valid (e.g., 30 for monthly, 365 for yearly)
          </p>
        </div>

        {/* Discount Percentage */}
        <div>
          <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700">
            Discount Percentage <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="discountPercent"
            value={formData.discountPercent}
            onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
            required
            min="0"
            max="100"
            step="0.1"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            The discount percentage members will receive on all orders (0-100)
          </p>
        </div>

        {/* Badge */}
        <div>
          <label htmlFor="badge" className="block text-sm font-medium text-gray-700">
            Badge - ব্যাজ
          </label>
          <input
            type="text"
            id="badge"
            value={formData.badge}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="e.g., সবচেয়ে জনপ্রিয়, সেরা মূল্য, নতুন"
          />
          <p className="mt-1 text-xs text-gray-500">
            Badge text shown on the plan card (e.g., সবচেয়ে জনপ্রিয়, Best Value)
          </p>
        </div>

        {/* Benefits Checklist */}
        <div>
          <label htmlFor="benefitsText" className="block text-sm font-medium text-gray-700">
            Benefits Checklist - সুবিধা তালিকা
          </label>
          <textarea
            id="benefitsText"
            value={formData.benefitsText}
            onChange={(e) => setFormData({ ...formData, benefitsText: e.target.value })}
            rows={6}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="প্রতিটি লাইনে একটি সুবিধা লিখুন:
সব ওষুধে ২০% ছাড়
বিনামূল্যে ডেলিভারি
২৪/৭ কাস্টমার সাপোর্ট
মাসিক হেলথ চেকআপ"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter each benefit on a new line (প্রতিটি লাইনে একটি সুবিধা লিখুন)
          </p>
        </div>

        {/* CTA Text */}
        <div>
          <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700">
            CTA Button Text - বাটন টেক্সট
          </label>
          <input
            type="text"
            id="ctaText"
            value={formData.ctaText}
            onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="e.g., এখনই শুরু করুন, সাবস্ক্রাইব করুন"
          />
          <p className="mt-1 text-xs text-gray-500">
            Call-to-action button text (e.g., এখনই শুরু করুন, Start Saving Today)
          </p>
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
            Sort Order - ক্রম
          </label>
          <input
            type="number"
            id="sortOrder"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
            min="0"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Lower numbers appear first (0, 1, 2...)
          </p>
        </div>

        {/* Highlight Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isHighlighted"
            checked={formData.isHighlighted}
            onChange={(e) => setFormData({ ...formData, isHighlighted: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="isHighlighted" className="text-sm font-medium text-gray-700">
            Highlight this plan - এই প্ল্যান হাইলাইট করুন
          </label>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Active (visible to customers)
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            href="/admin/memberships"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  )
}
