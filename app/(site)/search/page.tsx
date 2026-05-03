'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { MAIN_CONTAINER } from '@/lib/layout'

interface SearchProduct {
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
  category: {
    id: string
    name: string
    slug: string
  }
  href: string
  cartInfo: {
    kind: 'medicine' | 'product'
    productId?: string
    medicineId?: string
  }
  isMedicine: boolean
  sizeLabel?: string | null
  packSize?: string | null
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [products, setProducts] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [isFuzzy, setIsFuzzy] = useState(false)
  const [correctedQuery, setCorrectedQuery] = useState('')

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setProducts([])
        setSearched(false)
        setIsFuzzy(false)
        setCorrectedQuery('')
        return
      }

      setLoading(true)
      setError('')
      setSearched(true)
      setIsFuzzy(false)

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()

        if (res.ok) {
          setProducts(data.products || [])
          setIsFuzzy(data.isFuzzy || false)
          setCorrectedQuery(data.correctedQuery || '')
        } else {
          setError(data.error || 'Search failed')
        }
      } catch {
        setError('Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  return (
    <div className={`${MAIN_CONTAINER} py-6`}>
      {/* Search Header */}
      <div className="mb-8 border-b border-slate-200/90 pb-6">
        {query ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl sm:font-bold">
              &ldquo;{query}&rdquo; — অনুসন্ধানের ফলাফল
            </h1>
            {!loading && isFuzzy && correctedQuery && (
              <div className="mt-2 text-lg text-teal-600">
                আপনি কি বুঝাতে চেয়েছেন: <a href={`/search?q=${encodeURIComponent(correctedQuery)}`} className="font-bold underline hover:text-teal-700 italic">{correctedQuery}</a>?
              </div>
            )}
            {!loading && searched && (
              <p className="mt-2 text-sm text-slate-600">
                {products.length} টি পণ্য পাওয়া গেছে
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Search medicines & products
            </h1>
            <p className="mt-2 text-gray-600">
              Use the search bar above to find medicines, health products, and more.
            </p>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {/* Results Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6 [&>*]:min-w-0">
          {products.map((product, idx) => (
            <div key={product.id} className="flex h-full min-h-[18rem] sm:min-h-[19rem]">
              <ProductCard
                product={product}
                variant="compact"
                cartButtonVariant="outline"
                className="flex-1"
                imagePriority={idx < 6}
              />
            </div>
          ))}
        </div>
      )}

      {/* No Results State */}
      {!loading && searched && query && products.length === 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            No results found
          </h2>
          <p className="mt-2 text-gray-600">
            We couldn&apos;t find any products matching &quot;{query}&quot;.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try searching with different keywords or check the spelling.
          </p>
        </div>
      )}
    </div>
  )
}

function SearchFallback() {
  return (
    <div className={`${MAIN_CONTAINER} py-6`}>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  )
}
