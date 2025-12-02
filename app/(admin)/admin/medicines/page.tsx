'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, Edit, Trash2, AlertCircle, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

interface Medicine {
  id: string
  name: string
  slug: string
  genericName: string | null
  brandName: string | null
  sellingPrice: number
  mrp: number | null
  stockQuantity: number
  isActive: boolean
  isFeatured: boolean
  category: {
    id: string
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
}

export default function MedicinesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoryId') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('isActive') || 'all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMedicines()
    fetchCategories()
  }, [searchParams])

  const fetchMedicines = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (statusFilter !== 'all') params.set('isActive', statusFilter)
      params.set('page', searchParams.get('page') || '1')
      params.set('limit', '20')

      const res = await fetch(`/api/admin/medicines?${params}`)
      const data = await res.json()

      if (res.ok) {
        setMedicines(data.medicines)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search, page: '1' })
  }

  const handleFilterChange = () => {
    updateFilters({ categoryId: categoryFilter, isActive: statusFilter, page: '1' })
  }

  const updateFilters = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`/admin/medicines?${params}`)
  }

    const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this medicine?')) return

      try {
        const res = await fetch(`/api/admin/medicines/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          fetchMedicines()
          toast.success('Medicine deleted')
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to delete medicine')
        }
      } catch (error) {
        toast.error('Failed to delete medicine')
      }
    }

    const handleSelectAll = () => {
      if (selectedIds.size === medicines.length) {
        setSelectedIds(new Set())
      } else {
        setSelectedIds(new Set(medicines.map((m) => m.id)))
      }
    }

    const handleSelectOne = (id: string) => {
      const newSelected = new Set(selectedIds)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      setSelectedIds(newSelected)
    }

        const handleBulkDelete = async () => {
          if (selectedIds.size === 0) return

          const confirmed = confirm(
            `Are you sure you want to delete ${selectedIds.size} medicine(s)? This action cannot be undone.`
          )
          if (!confirmed) return

          setDeleting(true)
          try {
            const res = await fetch('/api/admin/medicines/bulk-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: Array.from(selectedIds) }),
            })

            const data = await res.json()

            if (res.ok) {
              toast.success(
                `Deleted ${data.summary.deleted} medicine(s)${
                  data.summary.softDeleted > 0
                    ? `, ${data.summary.softDeleted} soft-deleted (have orders)`
                    : ''
                }`
              )
              setSelectedIds(new Set())
              fetchMedicines()
            } else {
              toast.error(data.error || 'Failed to delete medicines')
            }
          } catch (error) {
            toast.error('Failed to delete medicines')
          } finally {
            setDeleting(false)
          }
        }

        const handleDeleteAll = async () => {
          const confirmed = confirm(
            `Are you sure you want to delete ALL ${pagination.total} medicine(s) matching the current filter? This action cannot be undone.`
          )
          if (!confirmed) return

          setDeleting(true)
          try {
            const res = await fetch('/api/admin/medicines/bulk-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                selectAll: true,
                filters: {
                  search: search || undefined,
                  categoryId: categoryFilter || undefined,
                  isActive: statusFilter,
                },
              }),
            })

            const data = await res.json()

            if (res.ok) {
              toast.success(
                `Deleted ${data.summary.deleted} medicine(s)${
                  data.summary.softDeleted > 0
                    ? `, ${data.summary.softDeleted} soft-deleted (have orders)`
                    : ''
                }`
              )
              setSelectedIds(new Set())
              fetchMedicines()
            } else {
              toast.error(data.error || 'Failed to delete medicines')
            }
          } catch (error) {
            toast.error('Failed to delete medicines')
          } finally {
            setDeleting(false)
          }
        }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medicines</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your medicine inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/medicines/bulk-upload"
            className="flex items-center gap-2 rounded-lg border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-600 transition-colors hover:bg-teal-50"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Link>
          <Link
            href="/admin/medicines/new"
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, generic name, or brand..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </form>

        {showFilters && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="true">Published (Active)</option>
                  <option value="false">Unpublished (Inactive)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleFilterChange}
                  className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : medicines.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No medicines found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by adding your first medicine.
          </p>
          <Link
            href="/admin/medicines/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </Link>
        </div>
      ) : (
        <>
                                        {(selectedIds.size > 0 || pagination.total > pagination.limit) && (
                                          <div className="flex items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-3">
                                            {selectedIds.size > 0 && (
                                              <>
                                                <span className="text-sm font-medium text-red-800">
                                                  {selectedIds.size} item(s) selected
                                                </span>
                                                <button
                                                  onClick={handleBulkDelete}
                                                  disabled={deleting}
                                                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-red-400"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                  {deleting ? 'Deleting...' : 'Delete Selected'}
                                                </button>
                                                <button
                                                  onClick={() => setSelectedIds(new Set())}
                                                  className="text-sm text-gray-600 hover:text-gray-900"
                                                >
                                                  Clear selection
                                                </button>
                                                <span className="text-gray-300">|</span>
                                              </>
                                            )}
                                            {pagination.total > pagination.limit && (
                                              <button
                                                onClick={handleDeleteAll}
                                                disabled={deleting}
                                                className="flex items-center gap-2 rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                                {deleting ? 'Deleting...' : `Delete All ${pagination.total} items`}
                                              </button>
                                            )}
                                          </div>
                                        )}

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="w-12 px-4 py-3">
                              <input
                                type="checkbox"
                                checked={medicines.length > 0 && selectedIds.size === medicines.length}
                                onChange={handleSelectAll}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                            </th>
                            <th className="w-16 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Stock
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
                                        {medicines.map((medicine, index) => (
                                          <tr
                                            key={medicine.id}
                                            className={`hover:bg-gray-50 ${
                                              selectedIds.has(medicine.id) ? 'bg-teal-50' : ''
                                            }`}
                                          >
                                            <td className="w-12 px-4 py-4">
                                              <input
                                                type="checkbox"
                                                checked={selectedIds.has(medicine.id)}
                                                onChange={() => handleSelectOne(medicine.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                              />
                                            </td>
                                            <td className="w-16 whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-500">
                                              {(pagination.page - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                              <div className="text-sm font-medium text-gray-900">
                                                {medicine.name}
                                                {medicine.isFeatured && (
                                                  <span className="ml-2 text-xs text-yellow-600">★</span>
                                                )}
                                              </div>
                                              {medicine.genericName && (
                                                <div className="text-sm text-gray-500">
                                                  {medicine.genericName}
                                                </div>
                                              )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                              {medicine.category.name}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                              <div className="text-sm font-medium text-gray-900">
                                                ৳{medicine.sellingPrice.toFixed(2)}
                                              </div>
                                              {medicine.mrp && medicine.mrp > medicine.sellingPrice && (
                                                <div className="text-xs text-gray-500 line-through">
                                                  ৳{medicine.mrp.toFixed(2)}
                                                </div>
                                              )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                              {medicine.stockQuantity}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                              <span
                                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                                  medicine.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                              >
                                                {medicine.isActive ? 'Active' : 'Inactive'}
                                              </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                              <div className="flex items-center justify-end gap-3">
                                                <Link
                                                  href={`/admin/medicines/${medicine.id}/edit`}
                                                  className="text-teal-600 hover:text-teal-900"
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                  onClick={() => handleDelete(medicine.id)}
                                                  className="text-red-600 hover:text-red-900"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <button
                    onClick={() => updateFilters({ page: String(pagination.page - 1) })}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                {pagination.page < pagination.totalPages && (
                  <button
                    onClick={() => updateFilters({ page: String(pagination.page + 1) })}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
