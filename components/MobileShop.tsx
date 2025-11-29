'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, ChevronRight } from 'lucide-react'
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
  flashSalePrice?: number | null
  flashSaleStart?: Date | string | null
  flashSaleEnd?: Date | string | null
  isFlashSale?: boolean | null
  category: {
    id: string
    name: string
    slug: string
  }
}

interface SidebarCategory {
  id: string
  name: string
  slug: string
  sidebarIconUrl: string | null
  sidebarLinkUrl: string | null
}

interface CategorySection {
  category: SidebarCategory
  products: Product[]
}

export function MobileShop() {
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([])
  const [categorySections, setCategorySections] = useState<CategorySection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch flash sale products
      const flashSaleRes = await fetch('/api/products?isFlashSale=true&limit=10')
      const flashSaleData = await flashSaleRes.json()
      if (flashSaleRes.ok) {
        setFlashSaleProducts(flashSaleData.products || [])
      }

      // Fetch sidebar categories
      const categoriesRes = await fetch('/api/sidebar-categories')
      const categoriesData = await categoriesRes.json()
      const categories: SidebarCategory[] = categoriesData.categories || []

      // Fetch products for each category
      const sections: CategorySection[] = []
      for (const category of categories.slice(0, 8)) {
        const productsRes = await fetch(`/api/products?categorySlug=${category.slug}&limit=10`)
        const productsData = await productsRes.json()
        if (productsRes.ok && productsData.products?.length > 0) {
          sections.push({
            category,
            products: productsData.products,
          })
        }
      }
      setCategorySections(sections)
    } catch (error) {
      console.error('Failed to fetch shop data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Flash Sale Section */}
      {flashSaleProducts.length > 0 && (
        <section className="py-4">
          <div className="mb-3 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
                <Zap className="h-4 w-4 text-white" fill="white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Flash Sale</h2>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                Hot Deals
              </span>
            </div>
            <Link
              href="/flash-sale"
              className="flex items-center gap-1 text-sm font-medium text-teal-600"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4">
            {flashSaleProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} variant="compact" />
            ))}
          </div>
        </section>
      )}

      {/* Category Sections */}
      {categorySections.map(({ category, products }) => (
        <section key={category.id} className="py-4">
          <div className="mb-3 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              {category.sidebarIconUrl ? (
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                  <img
                    src={category.sidebarIconUrl}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                  <span className="text-xs font-semibold text-teal-600">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
            </div>
            <Link
              href={category.sidebarLinkUrl || `/category/${category.slug}`}
              className="flex items-center gap-1 text-sm font-medium text-teal-600"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} variant="compact" />
            ))}
          </div>
        </section>
      ))}

      {categorySections.length === 0 && flashSaleProducts.length === 0 && (
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">No products available</h3>
            <p className="mt-2 text-sm text-gray-500">Check back later for new products</p>
          </div>
        </div>
      )}
    </div>
  )
}
