'use client'

import { useState, useEffect } from 'react'
import { Search, Tag, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  slug: string
  categoryId: string
  category: { name: string } | null
  aiTags: string[]
  isIngredient: boolean
  ingredientType: string | null
  budgetLevel: string | null
  sellingPrice: number
}

const INGREDIENT_TYPES = [
  { value: '', label: 'Not an ingredient' },
  { value: 'RICE', label: 'Rice' },
  { value: 'OIL', label: 'Oil' },
  { value: 'SPICE', label: 'Spice' },
  { value: 'MEAT', label: 'Meat' },
  { value: 'VEG', label: 'Vegetable' },
  { value: 'DAL', label: 'Dal/Lentils' },
  { value: 'FLOUR', label: 'Flour' },
  { value: 'DAIRY', label: 'Dairy' },
  { value: 'SNACK', label: 'Snack' },
  { value: 'BEVERAGE', label: 'Beverage' },
  { value: 'OTHER', label: 'Other' },
]

const BUDGET_LEVELS = [
  { value: '', label: 'Not set' },
  { value: 'BUDGET', label: 'Budget (সস্তা)' },
  { value: 'MID', label: 'Mid-range (মাঝারি)' },
  { value: 'PREMIUM', label: 'Premium (দামি)' },
]

const SUGGESTED_TAGS = [
  'cleanser', 'moisturizer', 'sunscreen', 'serum', 'toner', 'face-wash',
  'oily-skin', 'dry-skin', 'sensitive-skin', 'acne', 'anti-aging',
  'rice', 'biryani', 'pulao', 'curry', 'dal', 'vegetable',
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert',
  'organic', 'halal', 'local', 'imported', 'premium', 'budget',
  'skincare', 'haircare', 'bodycare', 'makeup', 'fragrance',
]

export default function ProductTaggingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [tagFilter, setTagFilter] = useState<'all' | 'tagged' | 'untagged'>('all')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (searchQuery) params.set('search', searchQuery)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (tagFilter === 'tagged') params.set('hasAiTags', 'true')
      if (tagFilter === 'untagged') params.set('hasAiTags', 'false')

      const res = await fetch(`/api/admin/product-tagging?${params}`)
      const data = await res.json()
      if (res.ok) {
        setProducts(data.products || [])
        setTotalPages(data.totalPages || 1)
      } else {
        toast.error(data.error || 'Failed to fetch products')
      }
    } catch {
      toast.error('Failed to fetch products')
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
    } catch {
      console.error('Failed to fetch categories')
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, categoryFilter, tagFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    setSaving(productId)
    try {
      const res = await fetch(`/api/admin/product-tagging/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        toast.success('Product updated')
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, ...updates } : p
        ))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update product')
      }
    } catch {
      toast.error('Failed to update product')
    } finally {
      setSaving(null)
    }
  }

  const addTag = (productId: string, tag: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-')
    if (!normalizedTag || product.aiTags.includes(normalizedTag)) return
    const newTags = [...product.aiTags, normalizedTag]
    updateProduct(productId, { aiTags: newTags })
  }

  const removeTag = (productId: string, tag: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const newTags = product.aiTags.filter(t => t !== tag)
    updateProduct(productId, { aiTags: newTags })
  }

  const handleIngredientTypeChange = (productId: string, value: string) => {
    const isIngredient = value !== ''
    updateProduct(productId, { 
      ingredientType: value || null, 
      isIngredient 
    })
  }

  const handleBudgetLevelChange = (productId: string, value: string) => {
    updateProduct(productId, { budgetLevel: value || null })
  }

  const taggedCount = products.filter(p => p.aiTags.length > 0).length
  const ingredientCount = products.filter(p => p.isIngredient).length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Tagging for AI Blog Engine</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tag products with AI-friendly labels for blog content generation. 
            Tagged: {taggedCount}/{products.length} | Ingredients: {ingredientCount}/{products.length}
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value as 'all' | 'tagged' | 'untagged'); setPage(1) }}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Products</option>
              <option value="tagged">Tagged Only</option>
              <option value="untagged">Untagged Only</option>
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
            <div className="p-8 text-center text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No products found. Try adjusting your filters.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {products.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {product.category?.name || 'No category'} • ৳{product.sellingPrice}
                      </p>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.aiTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-1 text-xs font-medium text-teal-800"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(product.id, tag)}
                              className="ml-1 text-teal-600 hover:text-teal-800"
                              disabled={saving === product.id}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {editingProduct === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addTag(product.id, newTag)
                                  setNewTag('')
                                }
                              }}
                              placeholder="Add tag..."
                              className="w-24 rounded border border-gray-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (newTag) addTag(product.id, newTag)
                                setNewTag('')
                                setEditingProduct(null)
                              }}
                              className="text-xs text-teal-600 hover:text-teal-800"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingProduct(product.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 hover:border-teal-500 hover:text-teal-600"
                          >
                            <Tag className="h-3 w-3" />
                            Add tag
                          </button>
                        )}
                      </div>

                      {editingProduct === product.id && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {SUGGESTED_TAGS.filter(t => !product.aiTags.includes(t)).slice(0, 10).map((tag) => (
                            <button
                              key={tag}
                              onClick={() => addTag(product.id, tag)}
                              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-teal-100 hover:text-teal-700"
                            >
                              +{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Ingredient Type</label>
                        <select
                          value={product.ingredientType || ''}
                          onChange={(e) => handleIngredientTypeChange(product.id, e.target.value)}
                          disabled={saving === product.id}
                          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                        >
                          {INGREDIENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Budget Level</label>
                        <select
                          value={product.budgetLevel || ''}
                          onChange={(e) => handleBudgetLevelChange(product.id, e.target.value)}
                          disabled={saving === product.id}
                          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                        >
                          {BUDGET_LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {saving === product.id && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-teal-600">
                      <Save className="h-3 w-3 animate-pulse" />
                      Saving...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
