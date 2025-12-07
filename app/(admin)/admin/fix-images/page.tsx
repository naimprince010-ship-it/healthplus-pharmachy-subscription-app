'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

interface FixResult {
  id: string
  name: string
  status: 'success' | 'failed'
  oldUrl: string
  newUrl?: string
  error?: string
}

export default function FixImagesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [results, setResults] = useState<FixResult[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/fix-external-images')
      const data = await res.json()
      if (res.ok) {
        setProducts(data.products || [])
      } else {
        setError(data.error || 'Failed to fetch products')
      }
    } catch {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fixSingleProduct = async (productId: string) => {
    setFixingId(productId)
    try {
      const res = await fetch('/api/admin/fix-external-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (res.ok && data.results) {
        setResults((prev) => [...prev, ...data.results])
        // Remove fixed product from list
        if (data.results[0]?.status === 'success') {
          setProducts((prev) => prev.filter((p) => p.id !== productId))
        }
      } else {
        setError(data.error || 'Failed to fix image')
      }
    } catch {
      setError('Failed to fix image')
    } finally {
      setFixingId(null)
    }
  }

  const fixAllProducts = async () => {
    setFixing(true)
    setResults([])
    try {
      const res = await fetch('/api/admin/fix-external-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixAll: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data.results || [])
        // Refresh the list
        await fetchProducts()
      } else {
        setError(data.error || 'Failed to fix images')
      }
    } catch {
      setError('Failed to fix images')
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fix External Images</h1>
        <p className="mt-1 text-sm text-gray-600">
          এই page-এ Chaldal, Arogga, MedEasy থেকে আসা external images fix করতে পারবেন। Images automatically download হয়ে Supabase-এ upload হবে।
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stats Card */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Products with External Images</p>
            <p className="text-3xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {products.length > 0 && (
              <button
                onClick={fixAllProducts}
                disabled={fixing || loading}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {fixing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Fix All Images
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-900">Results</h2>
          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.id}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {result.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{result.name}</p>
                  {result.status === 'success' ? (
                    <p className="text-sm text-green-600">Image fixed successfully</p>
                  ) : (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">All Images Fixed!</h3>
          <p className="mt-1 text-sm text-gray-600">
            কোনো external image নেই। সব images Supabase-এ আছে।
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Current Image
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = ''
                              ;(e.target as HTMLImageElement).alt = 'Broken'
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-xs truncate text-sm text-gray-500" title={product.imageUrl || ''}>
                      {product.imageUrl?.substring(0, 50)}...
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => fixSingleProduct(product.id)}
                      disabled={fixingId === product.id || fixing}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      {fixingId === product.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Fixing...
                        </>
                      ) : (
                        'Fix Image'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
