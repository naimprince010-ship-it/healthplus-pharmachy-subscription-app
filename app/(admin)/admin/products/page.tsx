'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, Edit, Trash2, AlertCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  type: 'MEDICINE' | 'GENERAL'
  name: string
  slug: string
  brandName: string | null
  sellingPrice: number
  purchasePrice?: number | null
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

interface StatusCounts {
  all: number
  active: number
  draft: number
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    active: 0,
    draft: 0,
  })

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoryId') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('isActive') || 'all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [syncingAzan, setSyncingAzan] = useState(false)
  const [applyingMargin, setApplyingMargin] = useState(false)
  const [marginPercent, setMarginPercent] = useState('30')

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [searchParams])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (typeFilter) params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('isActive', statusFilter)
      params.set('page', searchParams.get('page') || '1')
      params.set('limit', '20')

      const res = await fetch(`/api/admin/products?${params}`)
      const data = await res.json()

      if (res.ok) {
        setProducts(data.products)
        setPagination(data.pagination)
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
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
    updateFilters({
      categoryId: categoryFilter,
      type: typeFilter,
      isActive: statusFilter,
      page: '1'
    })
  }

  const handleQuickStatusChange = (nextStatus: 'all' | 'true' | 'false') => {
    setStatusFilter(nextStatus)
    updateFilters({ isActive: nextStatus, page: '1' })
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
    router.push(`/admin/products?${params}`)
  }

  const handleCleanupNames = async () => {
    if (!confirm('This will scan ALL products and fix repeated pack sizes in names (e.g. 100ml 100ml -> 100ml). Continue?')) return

    setCleaning(true)
    try {
      const res = await fetch('/api/admin/products/cleanup-names', {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        fetchProducts()
      } else {
        toast.error(data.error || 'Failed to clean up names')
      }
    } catch (error) {
      toast.error('Failed to clean up names')
    } finally {
      setCleaning(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchProducts()
        toast.success('Product deleted')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete product')
      }
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
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
      `Are you sure you want to delete ${selectedIds.size} product(s)? This action cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Deleted ${data.summary.deleted} product(s)`)
        setSelectedIds(new Set())
        fetchProducts()
      } else {
        toast.error(data.error || 'Failed to delete products')
      }
    } catch (error) {
      toast.error('Failed to delete products')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete ALL ${pagination.total} product(s) matching the current filter? This action cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectAll: true,
          filters: {
            search: search || undefined,
            categoryId: categoryFilter || undefined,
            type: typeFilter || undefined,
            isActive: statusFilter,
          },
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Deleted ${data.summary.deleted} product(s)`)
        setSelectedIds(new Set())
        fetchProducts()
      } else {
        toast.error(data.error || 'Failed to delete products')
      }
    } catch (error) {
      toast.error('Failed to delete products')
    } finally {
      setDeleting(false)
    }
  }

  const handleAzanSync = async () => {
    if (!confirm('Sync Azan products now? All synced items will remain Draft by default.')) return
    setSyncingAzan(true)
    try {
      const res = await fetch('/api/admin/products/azan-sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Azan sync failed')
        return
      }
      toast.success(
        `Azan sync done: ${data.summary?.fetched ?? 0} fetched, ${data.summary?.created ?? 0} created, ${data.summary?.updated ?? 0} updated`
      )
      fetchProducts()
    } catch {
      toast.error('Azan sync failed')
    } finally {
      setSyncingAzan(false)
    }
  }

  const runBulkMarginPublish = async (applyToAzanCategory: boolean) => {
    const parsedMargin = Number.parseFloat(marginPercent)
    if (!Number.isFinite(parsedMargin) || parsedMargin < 0) {
      toast.error('Enter a valid margin percent')
      return
    }

    if (!applyToAzanCategory && selectedIds.size === 0) {
      toast.error('Select products first')
      return
    }

    const targetText = applyToAzanCategory
      ? 'all Azan category products with purchase price'
      : `${selectedIds.size} selected product(s)`
    const confirmed = confirm(
      `Apply ${parsedMargin}% margin and publish ${targetText}?`
    )
    if (!confirmed) return

    setApplyingMargin(true)
    try {
      const res = await fetch('/api/admin/products/bulk-margin-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marginPercent: parsedMargin,
          publish: true,
          applyToAzanCategory,
          ids: applyToAzanCategory ? undefined : Array.from(selectedIds),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to apply margin')
        return
      }
      toast.success(
        `Updated ${data.summary?.updated ?? 0} products. Skipped missing purchase price: ${data.summary?.skippedMissingPurchasePrice ?? 0}`
      )
      if (!applyToAzanCategory) setSelectedIds(new Set())
      fetchProducts()
    } catch {
      toast.error('Failed to apply margin')
    } finally {
      setApplyingMargin(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage general products (skin care, baby care, devices, cosmetics, etc.)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAzanSync}
            disabled={syncingAzan}
            className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
          >
            {syncingAzan ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Azan (Draft)
          </button>
          <button
            onClick={handleCleanupNames}
            disabled={cleaning}
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            {cleaning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Clean Product Names
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">View:</span>
          <button
            type="button"
            onClick={() => handleQuickStatusChange('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            type="button"
            onClick={() => handleQuickStatusChange('true')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'true' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Active ({statusCounts.active})
          </button>
          <button
            type="button"
            onClick={() => handleQuickStatusChange('false')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'false' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            Draft ({statusCounts.draft})
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand, or description..."
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
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Types</option>
                  <option value="GENERAL">General Products</option>
                  <option value="MEDICINE">Medicines</option>
                </select>
              </div>
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
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by adding your first product.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-teal-100 bg-teal-50 p-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-teal-700">
                Margin %
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={marginPercent}
                onChange={(e) => setMarginPercent(e.target.value)}
                className="mt-1 w-28 rounded-lg border border-teal-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={() => runBulkMarginPublish(false)}
              disabled={applyingMargin || selectedIds.size === 0}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {applyingMargin ? 'Applying...' : 'Margin + Publish Selected'}
            </button>
            <button
              onClick={() => runBulkMarginPublish(true)}
              disabled={applyingMargin}
              className="rounded-lg border border-teal-600 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100 disabled:opacity-50"
            >
              {applyingMargin ? 'Applying...' : 'Margin + Publish All Azan'}
            </button>
            <p className="text-xs text-teal-800">
              Uses `purchasePrice` as cost price. Products without cost are skipped.
            </p>
          </div>

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

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.size === products.length}
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
                    Type
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
                {products.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${selectedIds.has(product.id) ? 'bg-teal-50' : ''
                      }`}
                  >
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => handleSelectOne(product.id)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="w-16 whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-500">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                        {product.isFeatured && (
                          <span className="ml-2 text-xs text-yellow-600">★</span>
                        )}
                      </div>
                      {product.brandName && (
                        <div className="text-sm text-gray-500">
                          {product.brandName}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${product.type === 'MEDICINE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                          }`}
                      >
                        {product.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {product.category.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ৳{product.sellingPrice.toFixed(2)}
                      </div>
                      {product.mrp && product.mrp > product.sellingPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          ৳{product.mrp.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {product.stockQuantity}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-teal-600 hover:text-teal-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
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
