'use client'

import { useState, useEffect } from 'react'
import { Search, Check, Plus, ExternalLink, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface MissingProduct {
  id: string
  name: string
  categorySuggestion: string | null
  reason: string
  isResolved: boolean
  resolvedProductId: string | null
  createdAt: string
  blog: { id: string; title: string; slug: string } | null
}

export default function MissingProductsPage() {
  const [missingProducts, setMissingProducts] = useState<MissingProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchMissingProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('resolved', filter === 'resolved' ? 'true' : 'false')
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/missing-products?${params}`)
      const data = await res.json()
      if (res.ok) {
        setMissingProducts(data.missingProducts || [])
      } else {
        toast.error(data.error || 'Failed to fetch missing products')
      }
    } catch {
      toast.error('Failed to fetch missing products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissingProducts()
  }, [filter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchMissingProducts()
  }

  const markAsResolved = async (id: string, productId?: string) => {
    try {
      const res = await fetch(`/api/admin/missing-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true, resolvedProductId: productId }),
      })
      if (res.ok) {
        toast.success('Marked as resolved')
        fetchMissingProducts()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  const unresolvedCount = missingProducts.filter(p => !p.isResolved).length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Missing Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Products needed by AI-generated blogs but not in your catalog. 
            Unresolved: {unresolvedCount}
          </p>
        </div>

        {unresolvedCount > 0 && (
          <div className="mb-6 rounded-lg bg-orange-50 border border-orange-200 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  {unresolvedCount} products are missing from your catalog
                </p>
                <p className="text-sm text-orange-700">
                  Adding these products will improve your blog content and help customers find what they need.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search missing products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unresolved' | 'resolved')}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="unresolved">Unresolved Only</option>
              <option value="resolved">Resolved Only</option>
              <option value="all">All</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Search
            </button>
          </form>
        </div>

        <div className="rounded-lg bg-white shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : missingProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filter === 'unresolved' 
                ? 'No unresolved missing products. Great job!'
                : 'No missing products found.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Suggested Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Related Blog
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
                {missingProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.categorySuggestion || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.reason}
                    </td>
                    <td className="px-6 py-4">
                      {product.blog ? (
                        <Link
                          href={`/admin/blog-queue`}
                          className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1"
                        >
                          {product.blog.title.substring(0, 30)}...
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.isResolved ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!product.isResolved && (
                          <>
                            <Link
                              href={`/admin/products/create?name=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.categorySuggestion || '')}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1 text-sm font-medium text-white hover:bg-teal-700"
                            >
                              <Plus className="h-3 w-3" />
                              Add Product
                            </Link>
                            <button
                              onClick={() => markAsResolved(product.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Mark as resolved"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
