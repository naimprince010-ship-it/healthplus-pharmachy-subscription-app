'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, X } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'

interface Product {
  id: string
  type: 'MEDICINE' | 'GENERAL'
  name: string
  slug: string
  brandName: string | null
  description: string | null
  sellingPrice: number
  mrp: number | null
  stockQuantity: number
  imageUrl: string | null
  discountPercentage?: number | null
  sizeLabel?: string | null
  packSize?: string | null
  category: {
    id: string
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

export function ProductsContentClient() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoryId') || '')
  const [sectionTitle, setSectionTitle] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setCategoryFilter(searchParams.get('categoryId') || '')
  }, [searchParams])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [searchParams])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('type', 'all')
      if (search) params.set('search', search)
      const sectionParam = searchParams.get('section')
      const categorySlugParam = searchParams.get('categorySlug')
      if (sectionParam) {
        params.set('section', sectionParam)
      } else {
        if (categoryFilter) params.set('categoryId', categoryFilter)
        if (categorySlugParam) params.set('categorySlug', categorySlugParam)
      }

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      if (res.ok) {
        setProducts(data.products || [])
        setSectionTitle(typeof data.sectionTitle === 'string' ? data.sectionTitle : null)
      } else {
        setSectionTitle(null)
        console.error('Failed to fetch products:', data.error)
      }
    } catch (error) {
      setSectionTitle(null)
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      } else {
        console.error('Failed to fetch categories:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const sectionParam = searchParams.get('section')
    const categorySlugParam = searchParams.get('categorySlug')
    if (sectionParam) {
      params.set('section', sectionParam)
    } else {
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (categorySlugParam) params.set('categorySlug', categorySlugParam)
    }
    window.location.href = `/products?${params}`
  }

  const currentCategory = useMemo(
    () => categories.find(c => c.id === categoryFilter) || null,
    [categories, categoryFilter]
  )

  const categoryFromSlug = useMemo(() => {
    const slug = searchParams.get('categorySlug')
    if (!slug) return null
    return categories.find((c) => c.slug === slug) || null
  }, [categories, searchParams])

  const hasActiveFilters = Boolean(
    searchParams.get('section') || searchParams.get('categorySlug') || categoryFilter
  )

  const getPageTitle = () => {
    if (sectionTitle) return sectionTitle
    if (currentCategory) return currentCategory.name
    if (categoryFromSlug) return categoryFromSlug.name
    return 'Shop All Products'
  }

  const getPageDescription = () => {
    const label = sectionTitle || currentCategory?.name || categoryFromSlug?.name
    if (label) return `Browse ${label}`
    return 'Browse our complete catalog of medicines and general products'
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="mt-2 text-gray-600">
                {getPageDescription()}
              </p>
            </div>
            {hasActiveFilters && (
              <Link
                href="/products"
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Clear filters
              </Link>
            )}
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2 md:hidden">
            <button
              onClick={() => {
                setCategoryFilter('')
                window.location.href = '/products'
              }}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !searchParams.get('section') && !searchParams.get('categorySlug') && !categoryFilter
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(cat.id)
                  const params = new URLSearchParams()
                  params.set('categoryId', cat.id)
                  if (search) params.set('search', search)
                  window.location.href = `/products?${params}`
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  !searchParams.get('section') && !searchParams.get('categorySlug') && categoryFilter === cat.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-8 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${currentCategory ? currentCategory.name : 'products'}...`}
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
          </div>

          {showFilters && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
