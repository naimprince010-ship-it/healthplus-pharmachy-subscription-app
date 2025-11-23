'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionPlan } from '@prisma/client'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface SubscriptionPlanFormProps {
  plan?: SubscriptionPlan
}

export function SubscriptionPlanForm({ plan }: SubscriptionPlanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: plan?.name || '',
    slug: plan?.slug || '',
    shortDescription: plan?.shortDescription || '',
    itemsSummary: plan?.itemsSummary || '',
    priceMonthly: plan?.priceMonthly?.toString() || '',
    bannerImageUrl: plan?.bannerImageUrl || '',
    sortOrder: plan?.sortOrder?.toString() || '',
    isFeatured: plan?.isFeatured || false,
    isActive: plan?.isActive ?? true,
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: plan ? formData.slug : generateSlug(name),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = plan
        ? `/api/admin/subscription-plans/${plan.id}`
        : '/api/admin/subscription-plans'
      
      const method = plan ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priceMonthly: parseInt(formData.priceMonthly),
          sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save plan')
      }

      router.push('/admin/subscription-plans')
      router.refresh()
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

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Plan Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Slug *
        </label>
        <input
          type="text"
          id="slug"
          required
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          URL-friendly identifier (e.g., family-pack)
        </p>
      </div>

      <div>
        <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
          Short Description
        </label>
        <textarea
          id="shortDescription"
          rows={2}
          value={formData.shortDescription}
          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Brief description shown on cards
        </p>
      </div>

      <div>
        <label htmlFor="priceMonthly" className="block text-sm font-medium text-gray-700">
          Monthly Price (BDT) *
        </label>
        <input
          type="number"
          id="priceMonthly"
          required
          min="0"
          value={formData.priceMonthly}
          onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div>
        <label htmlFor="itemsSummary" className="block text-sm font-medium text-gray-700">
          Items Included
        </label>
        <textarea
          id="itemsSummary"
          rows={6}
          value={formData.itemsSummary}
          onChange={(e) => setFormData({ ...formData, itemsSummary: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
          placeholder="Enter each item on a new line"
        />
        <p className="mt-1 text-xs text-gray-500">
          List of medicines/items included (one per line)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Banner Image
        </label>
        <ImageUpload
          value={formData.bannerImageUrl}
          onChange={(url) => setFormData({ ...formData, bannerImageUrl: url })}
        />
      </div>

      <div>
        <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
          Sort Order
        </label>
        <input
          type="number"
          id="sortOrder"
          value={formData.sortOrder}
          onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Lower numbers appear first
        </p>
      </div>

      <div className="flex items-center space-x-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isFeatured}
            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">Featured</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">Active</span>
        </label>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-teal-600 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
