'use client'

import Link from 'next/link'
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
  // Pre-computed values from server to avoid hydration mismatch
  effectivePrice?: number
  effectiveMrp?: number
  effectiveDiscountPercent?: number
  isFlashSaleActive?: boolean
  category: {
    id: string
    name: string
    slug: string
  }
}

interface SectionSliderProps {
  section: {
    id: string
    title: string
    slug: string
    badgeText: string | null
    bgColor: string | null
  }
  products: Product[]
}

export function SectionSlider({ section, products }: SectionSliderProps) {
  if (products.length === 0) {
    return null
  }

  const bgStyle = section.bgColor ? { backgroundColor: section.bgColor } : {}

  return (
    // Full-width section with background color
    <section className="w-full py-4" style={bgStyle}>
      {/* Centered content container */}
      <div className="mx-auto w-full max-w-[1400px] px-2 sm:px-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">
              {section.title}
              {section.badgeText && (
                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 lg:ml-3 lg:px-3 lg:py-1 lg:text-sm">
                  {section.badgeText}
                </span>
              )}
            </h2>
          </div>
          <Link
            href={`/sections/${section.slug}`}
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            সবগুলো দেখুন
          </Link>
        </div>

        {/* CSS Grid with auto-wrap - products wrap automatically based on available space */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="w-full">
              <ProductCard product={product} variant="compact" className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
