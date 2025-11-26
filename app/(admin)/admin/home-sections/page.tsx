'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface HomeSection {
  id: string
  title: string
  slug: string
  filterType: string
  categoryId: string | null
  brandName: string | null
  productIds: any
  maxProducts: number
  bgColor: string | null
  badgeText: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  category: {
    id: string
    name: string
  } | null
}

function HomeSectionsContent() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSections()
  }, [])

  async function fetchSections() {
    try {
      const response = await fetch('/api/admin/home-sections')
      const data = await response.json()
      setSections(data.sections || [])
    } catch (error) {
      console.error('Failed to fetch sections:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this section?')) {
      return
    }

    try {
      await fetch(`/api/admin/home-sections/${id}`, {
        method: 'DELETE',
      })
      fetchSections()
    } catch (error) {
      console.error('Failed to delete section:', error)
      alert('Failed to delete section')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Sections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage product sections displayed on homepage
          </p>
        </div>
        <Link
          href="/admin/home-sections/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Filter Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No sections found. Create your first section to get started.
                  </td>
                </tr>
              ) : (
                sections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{section.title}</div>
                      {section.badgeText && (
                        <div className="mt-1 text-xs text-gray-500">{section.badgeText}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {section.slug}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 capitalize">
                        {section.filterType}
                      </div>
                      {section.filterType === 'category' && section.category && (
                        <div className="text-xs text-gray-500">{section.category.name}</div>
                      )}
                      {section.filterType === 'brand' && section.brandName && (
                        <div className="text-xs text-gray-500">{section.brandName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {section.sortOrder}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          section.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {section.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/home-sections/${section.id}/edit`}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(section.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function HomeSectionsPage() {
  return <HomeSectionsContent />
}
