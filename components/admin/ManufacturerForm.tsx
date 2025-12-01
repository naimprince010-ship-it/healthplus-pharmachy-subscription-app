'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Manufacturer {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  websiteUrl?: string | null
  description?: string | null
  phoneNumber?: string | null
  aliasList?: string[] | null
}

interface ManufacturerFormProps {
  manufacturer?: Manufacturer
}

export default function ManufacturerForm({ manufacturer }: ManufacturerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

    const [formData, setFormData] = useState({
      name: manufacturer?.name || '',
      slug: manufacturer?.slug || '',
      logoUrl: manufacturer?.logoUrl || '',
      websiteUrl: manufacturer?.websiteUrl || '',
      description: manufacturer?.description || '',
      phoneNumber: manufacturer?.phoneNumber || '',
      aliasList: manufacturer?.aliasList?.join(', ') || '',
    })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !manufacturer ? generateSlug(name) : prev.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = manufacturer
        ? `/api/admin/manufacturers/${manufacturer.id}`
        : '/api/admin/manufacturers'

      const method = manufacturer ? 'PUT' : 'POST'

      const aliasArray = formData.aliasList
        ? formData.aliasList.split(',').map(s => s.trim()).filter(Boolean)
        : null

            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                name: formData.name,
                slug: formData.slug,
                logoUrl: formData.logoUrl || null,
                websiteUrl: formData.websiteUrl || null,
                description: formData.description || null,
                phoneNumber: formData.phoneNumber?.trim() || null,
                aliasList: aliasArray,
              }),
            })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save manufacturer')
        setIsSubmitting(false)
        return
      }

      router.push('/admin/manufacturers')
      router.refresh()
    } catch (err) {
      console.error('Error saving manufacturer:', err)
      setError('Failed to save manufacturer')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <Link
        href="/admin/manufacturers"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Manufacturers
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
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="e.g., Square Pharmaceuticals Ltd."
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="Slug must be lowercase letters, numbers, and hyphens only"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            URL-friendly identifier (lowercase, numbers, and hyphens only)
          </p>
        </div>

        {/* Logo URL */}
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
            Logo URL
          </label>
          <input
            type="url"
            id="logoUrl"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="https://example.com/logo.png"
          />
          {formData.logoUrl && (
            <div className="mt-2">
              <img
                src={formData.logoUrl}
                alt="Logo preview"
                className="h-16 w-16 rounded object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

                {/* Website URL */}
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="https://www.example.com"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    maxLength={20}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="+8801XXXXXXXXX"
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
            placeholder="Brief description of the manufacturer..."
          />
        </div>

        {/* Alias List */}
        <div>
          <label htmlFor="aliasList" className="block text-sm font-medium text-gray-700">
            Alternative Names (Aliases)
          </label>
          <input
            type="text"
            id="aliasList"
            value={formData.aliasList}
            onChange={(e) => setFormData({ ...formData, aliasList: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Square, Square Pharma, Square Ltd."
          />
          <p className="mt-1 text-xs text-gray-500">
            Comma-separated list of alternative names for matching during import
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            href="/admin/manufacturers"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : manufacturer ? 'Update Manufacturer' : 'Create Manufacturer'}
          </button>
        </div>
      </form>
    </div>
  )
}
