'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  parentCategoryId?: string | null
  isActive: boolean
  isMedicineCategory?: boolean
  sortOrder?: number
  showInSidebar?: boolean
  sidebarOrder?: number
  sidebarIconUrl?: string | null
  sidebarLinkUrl?: string | null
}

interface CategoryOption {
  id: string
  name: string
}

interface CategoryFormProps {
  category?: Category
  categories: CategoryOption[]
}

export default function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    parentCategoryId: category?.parentCategoryId || '',
    isActive: category?.isActive ?? true,
    isMedicineCategory: category?.isMedicineCategory ?? false,
    sortOrder: category?.sortOrder ?? 0,
    showInSidebar: category?.showInSidebar ?? false,
    sidebarOrder: category?.sidebarOrder ?? 0,
    sidebarIconUrl: category?.sidebarIconUrl || '',
    sidebarLinkUrl: category?.sidebarLinkUrl || '',
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
      slug: !category ? generateSlug(name) : prev.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = category
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories'

      const method = category ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          parentCategoryId: formData.parentCategoryId || null,
          description: formData.description || null,
          imageUrl: formData.imageUrl || null,
          sidebarIconUrl: formData.sidebarIconUrl || null,
          sidebarLinkUrl: formData.sidebarLinkUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save category')
        setIsSubmitting(false)
        return
      }

      router.push('/admin/categories')
      router.refresh()
    } catch (err) {
      console.error('Error saving category:', err)
      setError('Failed to save category')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <Link
        href="/admin/categories"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Categories
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
          />
        </div>

        {/* Parent Category */}
        <div>
          <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700">
            Parent Category
          </label>
          <select
            id="parentCategory"
            value={formData.parentCategoryId}
            onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">None (Top-level category)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Select a parent category to create a sub-category
          </p>
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
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
            Lower numbers appear first in the list
          </p>
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
            Active
          </label>
        </div>

        {/* Medicine Category Toggle */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isMedicineCategory"
              checked={formData.isMedicineCategory}
              onChange={(e) => setFormData({ ...formData, isMedicineCategory: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="isMedicineCategory" className="text-sm font-medium text-gray-700">
              Medicine Category
            </label>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, products in this category will automatically be set as medicines (requiring prescriptions, etc.). 
            Leave unchecked for general products like baby care, cosmetics, devices, etc.
          </p>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Left Sidebar Settings</h3>
          
          {/* Show in Sidebar */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showInSidebar"
              checked={formData.showInSidebar}
              onChange={(e) => setFormData({ ...formData, showInSidebar: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="showInSidebar" className="text-sm font-medium text-gray-700">
              Show in left sidebar
            </label>
          </div>

          {/* Sidebar Order */}
          <div>
            <label htmlFor="sidebarOrder" className="block text-sm font-medium text-gray-700">
              Sidebar order
            </label>
            <input
              type="number"
              id="sidebarOrder"
              value={formData.sidebarOrder}
              onChange={(e) => setFormData({ ...formData, sidebarOrder: parseInt(e.target.value) || 0 })}
              min="0"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first in the sidebar
            </p>
          </div>

          {/* Sidebar Icon URL */}
          <div>
            <label htmlFor="sidebarIconUrl" className="block text-sm font-medium text-gray-700">
              Sidebar icon URL
            </label>
            <input
              type="url"
              id="sidebarIconUrl"
              value={formData.sidebarIconUrl}
              onChange={(e) => setFormData({ ...formData, sidebarIconUrl: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="https://example.com/icon.png"
            />
            <p className="mt-1 text-xs text-gray-500">
              Small round icon for the sidebar (optional)
            </p>
          </div>

          {/* Sidebar Link URL */}
          <div>
            <label htmlFor="sidebarLinkUrl" className="block text-sm font-medium text-gray-700">
              Custom sidebar link URL
            </label>
            <input
              type="text"
              id="sidebarLinkUrl"
              value={formData.sidebarLinkUrl}
              onChange={(e) => setFormData({ ...formData, sidebarLinkUrl: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="/sections/women-s-choice"
            />
            <p className="mt-1 text-xs text-gray-500">
              Custom link URL for sidebar (e.g., /sections/women-s-choice). Leave empty to use default category filter.
            </p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            href="/admin/categories"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  )
}
