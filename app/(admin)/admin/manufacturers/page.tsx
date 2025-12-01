'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, Plus, Trash2, Search, ExternalLink } from 'lucide-react'

interface Manufacturer {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  websiteUrl: string | null
  description: string | null
  createdAt: string
  _count: {
    products: number
  }
}

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; productCount: number } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchManufacturers()
  }, [])

  const fetchManufacturers = async () => {
    try {
      const res = await fetch('/api/admin/manufacturers')
      if (res.ok) {
        const data = await res.json()
        setManufacturers(data.manufacturers || [])
      }
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, force: boolean = false) => {
    setDeleting(true)
    try {
      const url = force ? `/api/admin/manufacturers/${id}?force=true` : `/api/admin/manufacturers/${id}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        setManufacturers(manufacturers.filter(m => m.id !== id))
        setDeleteConfirm(null)
      } else if (data.canForceDelete) {
        setDeleteConfirm({ id, name: deleteConfirm?.name || '', productCount: data.productCount })
      } else {
        alert(data.error || 'Failed to delete manufacturer')
      }
    } catch (error) {
      console.error('Failed to delete manufacturer:', error)
      alert('Failed to delete manufacturer')
    } finally {
      setDeleting(false)
    }
  }

  const filteredManufacturers = manufacturers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.slug.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading manufacturers...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manufacturers</h1>
          <Link
            href="/admin/manufacturers/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Manufacturer
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search manufacturers..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  # Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredManufacturers.map((manufacturer) => (
                <tr key={manufacturer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {manufacturer.logoUrl && (
                        <img
                          src={manufacturer.logoUrl}
                          alt={manufacturer.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {manufacturer.name}
                        </div>
                        {manufacturer.websiteUrl && (
                          <a
                            href={manufacturer.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                          >
                            Website <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {manufacturer.slug}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {manufacturer._count.products}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(manufacturer.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/manufacturers/${manufacturer.id}/edit`}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({
                          id: manufacturer.id,
                          name: manufacturer.name,
                          productCount: manufacturer._count.products,
                        })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredManufacturers.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              {search
                ? 'No manufacturers found matching your search'
                : 'No manufacturers yet. Create your first manufacturer to get started.'}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Manufacturer</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete &quot;{deleteConfirm.name}&quot;?
            </p>
            {deleteConfirm.productCount > 0 && (
              <p className="mt-2 text-sm text-amber-600">
                Warning: {deleteConfirm.productCount} product(s) are linked to this manufacturer.
                Deleting will remove the manufacturer reference from these products.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.productCount > 0)}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
