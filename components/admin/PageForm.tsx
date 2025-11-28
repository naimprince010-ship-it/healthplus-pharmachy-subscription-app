'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Page {
  id: string
  title: string
  slug: string
  content: string
  group: 'QUICK_LINKS' | 'SUPPORT' | 'NONE'
  sortOrder: number
  isPublished: boolean
}

interface PageFormProps {
  page?: Page
}

export default function PageForm({ page }: PageFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    content: page?.content || '',
    group: page?.group || 'SUPPORT',
    sortOrder: page?.sortOrder ?? 0,
    isPublished: page?.isPublished ?? true,
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: !page ? generateSlug(title) : prev.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = page
        ? `/api/admin/pages/${page.id}`
        : '/api/admin/pages'

      const method = page ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save page')
        setIsSubmitting(false)
        return
      }

      router.push('/admin/pages')
      router.refresh()
    } catch (err) {
      console.error('Error saving page:', err)
      setError('Failed to save page')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <Link
        href="/admin/pages"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pages
      </Link>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="e.g., About Us, FAQ, Privacy Policy"
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
            placeholder="e.g., about-us, faq, privacy-policy"
          />
          <p className="mt-1 text-xs text-gray-500">
            URL-friendly identifier. Page will be accessible at /pages/{formData.slug || 'slug'}
          </p>
        </div>

        {/* Group */}
        <div>
          <label htmlFor="group" className="block text-sm font-medium text-gray-700">
            Footer Group
          </label>
          <select
            id="group"
            value={formData.group}
            onChange={(e) => setFormData({ ...formData, group: e.target.value as 'QUICK_LINKS' | 'SUPPORT' | 'NONE' })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="QUICK_LINKS">Quick Links</option>
            <option value="SUPPORT">Support</option>
            <option value="NONE">None (not shown in footer)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Select which footer section this page should appear in
          </p>
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
            Sort Order
          </label>
          <input
            type="number"
            id="sortOrder"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            min="0"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Lower numbers appear first in the footer
          </p>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={15}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Enter page content here. HTML is supported."
          />
          <p className="mt-1 text-xs text-gray-500">
            You can use HTML tags for formatting (e.g., &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;)
          </p>
        </div>

        {/* Published Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
            Published
          </label>
          <span className="text-xs text-gray-500">
            (Unpublished pages won&apos;t appear in the footer or be accessible)
          </span>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            href="/admin/pages"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : page ? 'Update Page' : 'Create Page'}
          </button>
        </div>
      </form>
    </div>
  )
}
