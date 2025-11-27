'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Search } from 'lucide-react'
import { useForm, type DefaultValues, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { baseHomeSectionSchema, type BaseHomeSectionInput } from '@/lib/validations/homeSection'

interface HomeSectionFormProps {
  mode: 'create' | 'edit'
  sectionId?: string
  initialData?: Partial<BaseHomeSectionInput>
}

export function HomeSectionForm({ mode, sectionId, initialData }: HomeSectionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [filterType, setFilterType] = useState<'category' | 'brand' | 'manual'>(initialData?.filterType || 'category')
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])

  type FormValues = BaseHomeSectionInput

  const defaults: DefaultValues<BaseHomeSectionInput> = (initialData ?? {
    isActive: true,
    sortOrder: 0,
    maxProducts: 10,
    filterType: 'category',
  }) as DefaultValues<BaseHomeSectionInput>

  // Use baseHomeSectionSchema for form validation (doesn't require id)
  // The API route will add id for update validation
  const resolver: Resolver<FormValues> = zodResolver(baseHomeSectionSchema) as unknown as Resolver<FormValues>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    defaultValues: defaults as Partial<FormValues>,
  })

  useEffect(() => {
    fetchCategories()
    if (initialData?.productIds && Array.isArray(initialData.productIds)) {
      fetchInitialProducts(initialData.productIds)
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchInitialProducts = async (productIds: string[]) => {
    try {
      const res = await fetch(`/api/admin/products?ids=${productIds.join(',')}`)
      const data = await res.json()
      if (res.ok) {
        setSelectedProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to fetch initial products:', err)
    }
  }

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(query)}&limit=10&type=all`)
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.products || [])
      }
    } catch (err) {
      console.error('Failed to search products:', err)
    }
  }

  const addProduct = (product: any) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      const updated = [...selectedProducts, product]
      setSelectedProducts(updated)
      setValue('productIds', updated.map(p => p.id))
    }
    setProductSearch('')
    setSearchResults([])
  }

  const removeProduct = (productId: string) => {
    const updated = selectedProducts.filter(p => p.id !== productId)
    setSelectedProducts(updated)
    setValue('productIds', updated.map(p => p.id))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const onSubmit = async (data: BaseHomeSectionInput) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...data,
        productIds: filterType === 'manual' ? selectedProducts.map(p => p.id) : null,
        categoryId: filterType === 'category' ? data.categoryId : null,
        brandName: filterType === 'brand' ? data.brandName : null,
      }

      const url = mode === 'create' 
        ? '/api/admin/home-sections'
        : `/api/admin/home-sections/${sectionId}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save home section')
      }

      router.push('/admin/home-sections')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/home-sections"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Create Home Section' : 'Edit Home Section'}
              </h1>
              <p className="text-sm text-gray-500">
                {mode === 'create' ? 'Add a new product section to homepage' : 'Update section details'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Info</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  {...register('title')}
                  onChange={(e) => {
                    register('title').onChange(e)
                    if (mode === 'create') {
                      setValue('slug', generateSlug(e.target.value))
                    }
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Featured Products"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slug *
                </label>
                <input
                  type="text"
                  {...register('slug')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="featured-products"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Filter Type *
                </label>
                <select
                  {...register('filterType')}
                  onChange={(e) => {
                    register('filterType').onChange(e)
                    setFilterType(e.target.value as 'category' | 'brand' | 'manual')
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="category">By Category</option>
                  <option value="brand">By Brand</option>
                  <option value="manual">Manual Selection</option>
                </select>
                {errors.filterType && (
                  <p className="mt-1 text-sm text-red-600">{errors.filterType.message}</p>
                )}
              </div>

              {filterType === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    {...register('categoryId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                  )}
                </div>
              )}

              {filterType === 'brand' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    {...register('brandName')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Square Pharmaceuticals"
                  />
                  {errors.brandName && (
                    <p className="mt-1 text-sm text-red-600">{errors.brandName.message}</p>
                  )}
                </div>
              )}

              {filterType === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Products
                  </label>
                  <div className="mt-1 relative">
                    <div className="flex">
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value)
                          searchProducts(e.target.value)
                        }}
                        className="block w-full rounded-l-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="Search products..."
                      />
                      <button
                        type="button"
                        className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 py-2"
                      >
                        <Search className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProduct(product)}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-50"
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">৳{product.sellingPrice}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedProducts.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {selectedProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">৳{product.sellingPrice}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Products
                </label>
                <input
                  type="number"
                  {...register('maxProducts', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  min="1"
                  max="50"
                />
                {errors.maxProducts && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxProducts.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Background Color
                </label>
                <input
                  type="text"
                  {...register('bgColor')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="#f3f4f6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Badge Text
                </label>
                <input
                  type="text"
                  {...register('badgeText')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., New Arrivals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sort Order
                </label>
                <input
                  type="number"
                  {...register('sortOrder', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/admin/home-sections"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
