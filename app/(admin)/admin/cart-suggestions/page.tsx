'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Loader2, GripVertical, Search } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sellingPrice: number
  mrp: number | null
}

interface CartSuggestion {
  id: string
  productId: string
  sortOrder: number
  isActive: boolean
  product: Product
}

export default function CartSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<CartSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/admin/cart-suggestions')
      const data = await res.json()
      if (data.suggestions) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setMessage({ type: 'error', text: 'Failed to load suggestions' })
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`)
      const data = await res.json()
      if (data.products) {
        const existingIds = new Set(suggestions.map((s) => s.productId))
        setSearchResults(
          data.products
            .filter((p: Product) => !existingIds.has(p.id))
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              imageUrl: p.imageUrl,
              sellingPrice: p.sellingPrice || p.price,
              mrp: p.mrp,
            }))
        )
      }
    } catch (error) {
      console.error('Failed to search products:', error)
    } finally {
      setSearching(false)
    }
  }

  const addSuggestion = async (product: Product) => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/cart-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          sortOrder: suggestions.length,
          isActive: true,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSuggestions([...suggestions, data.suggestion])
        setMessage({ type: 'success', text: 'Product added to suggestions!' })
        setShowAddModal(false)
        setSearchQuery('')
        setSearchResults([])
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to add suggestion' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add suggestion' })
    } finally {
      setSaving(false)
    }
  }

  const deleteSuggestion = async (id: string) => {
    if (!confirm('Are you sure you want to remove this suggestion?')) return

    try {
      const res = await fetch(`/api/admin/cart-suggestions/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSuggestions(suggestions.filter((s) => s.id !== id))
        setMessage({ type: 'success', text: 'Suggestion removed!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to remove suggestion' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove suggestion' })
    }
  }

  const toggleActive = async (suggestion: CartSuggestion) => {
    try {
      const res = await fetch(`/api/admin/cart-suggestions/${suggestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...suggestion,
          isActive: !suggestion.isActive,
        }),
      })

      if (res.ok) {
        setSuggestions(
          suggestions.map((s) =>
            s.id === suggestion.id ? { ...s, isActive: !s.isActive } : s
          )
        )
      }
    } catch (error) {
      console.error('Failed to toggle active:', error)
    }
  }

  const updateSortOrder = async (id: string, newOrder: number) => {
    const suggestion = suggestions.find((s) => s.id === id)
    if (!suggestion) return

    try {
      await fetch(`/api/admin/cart-suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...suggestion,
          sortOrder: newOrder,
        }),
      })

      setSuggestions(
        suggestions
          .map((s) => (s.id === id ? { ...s, sortOrder: newOrder } : s))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      )
    } catch (error) {
      console.error('Failed to update sort order:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cart Suggestions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage products shown in the &quot;আপনার জন্য সাজেশন&quot; section
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        {suggestions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No suggestions added yet. Click &quot;Add Product&quot; to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Active
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {suggestions.map((suggestion, index) => (
                <tr key={suggestion.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={suggestion.sortOrder}
                        onChange={(e) =>
                          updateSortOrder(suggestion.id, parseInt(e.target.value) || 0)
                        }
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {suggestion.product.imageUrl ? (
                          <Image
                            src={suggestion.product.imageUrl}
                            alt={suggestion.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No img
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{suggestion.product.name}</p>
                        <p className="text-xs text-gray-500">{suggestion.product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-medium text-gray-900">
                      ৳{suggestion.product.sellingPrice}
                    </span>
                    {suggestion.product.mrp && suggestion.product.mrp > suggestion.product.sellingPrice && (
                      <span className="ml-2 text-sm text-gray-400 line-through">
                        ৳{suggestion.product.mrp}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={() => toggleActive(suggestion)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        suggestion.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {suggestion.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => deleteSuggestion(suggestion.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Product to Suggestions</h2>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchProducts(e.target.value)
                }}
                placeholder="Search products..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                autoFocus
              />
            </div>

            <div className="mt-4 max-h-64 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addSuggestion(product)}
                      disabled={saving}
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 disabled:opacity-50"
                    >
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">৳{product.sellingPrice}</p>
                      </div>
                      <Plus className="h-5 w-5 text-teal-600" />
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <p className="py-4 text-center text-gray-500">No products found</p>
              ) : (
                <p className="py-4 text-center text-gray-500">Type to search for products</p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
