'use client'

import { useState, useRef } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductData {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  mrp: number | null
  sellingPrice: number
  stockQuantity: number
  isFeatured: boolean | null
  discountPercentage: number | null
  type: 'MEDICINE' | 'GENERAL'
  brandName: string | null
  createdAt: string
  orderCount: number
  category: {
    id: string
    name: string
    slug: string
  }
  effectivePrice: number
  effectiveMrp: number
  effectiveDiscountPercent: number
  isFlashSaleActive: boolean
}

interface CategoryData {
  id: string
  name: string
  slug: string
}

interface ManufacturerPageClientProps {
  bestSellingProducts: ProductData[]
  newlyLaunchedProducts: ProductData[]
  allProducts: ProductData[]
  categories: CategoryData[]
  manufacturerName: string
}

const PRODUCTS_PER_PAGE = 20

function ProductCarousel({ products, title }: { products: ProductData[]; title: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
      setTimeout(checkScrollButtons, 300)
    }
  }

  if (products.length === 0) return null

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}

        {/* Products Container */}
        <div
          ref={scrollRef}
          onScroll={checkScrollButtons}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[220px]">
              <ProductCard
                product={{
                  id: product.id,
                  type: product.type,
                  name: product.name,
                  slug: product.slug,
                  brandName: product.brandName,
                  description: product.description,
                  sellingPrice: product.sellingPrice,
                  mrp: product.mrp,
                  stockQuantity: product.stockQuantity,
                  imageUrl: product.imageUrl,
                  discountPercentage: product.discountPercentage,
                  effectivePrice: product.effectivePrice,
                  effectiveMrp: product.effectiveMrp,
                  effectiveDiscountPercent: product.effectiveDiscountPercent,
                  isFlashSaleActive: product.isFlashSaleActive,
                  category: product.category,
                }}
                variant="compact"
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && products.length > 4 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>
    </section>
  )
}

export function ManufacturerPageClient({
  bestSellingProducts,
  newlyLaunchedProducts,
  allProducts,
  categories,
  manufacturerName,
}: ManufacturerPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? allProducts.filter((p) => p.category.id === selectedCategory)
    : allProducts

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  )

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
  }

  return (
    <>
      {/* Best Selling Products Carousel */}
      <ProductCarousel products={bestSellingProducts} title="Best Selling Products" />

      {/* Newly Launched Items Carousel */}
      <ProductCarousel products={newlyLaunchedProducts} title="Newly launched Items" />

      {/* All Products Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Products</h2>

        {/* Category Filter Chips */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({allProducts.length})
            </button>
            {categories.map((category) => {
              const count = allProducts.filter((p) => p.category.id === category.id).length
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Products Grid */}
        {paginatedProducts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No products found from {manufacturerName}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  type: product.type,
                  name: product.name,
                  slug: product.slug,
                  brandName: product.brandName,
                  description: product.description,
                  sellingPrice: product.sellingPrice,
                  mrp: product.mrp,
                  stockQuantity: product.stockQuantity,
                  imageUrl: product.imageUrl,
                  discountPercentage: product.discountPercentage,
                  effectivePrice: product.effectivePrice,
                  effectiveMrp: product.effectiveMrp,
                  effectiveDiscountPercent: product.effectiveDiscountPercent,
                  isFlashSaleActive: product.isFlashSaleActive,
                  category: product.category,
                }}
                variant="compact"
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-teal-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </>
  )
}
