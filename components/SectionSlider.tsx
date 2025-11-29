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
    // Full-width section with background color - compact padding on desktop
    <section className="w-full py-4 lg:py-2" style={bgStyle}>
      {/* Full-width content - no max-width so it fills the ShopLayout grid column */}
      <div className="w-full px-2 sm:px-4">
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

        {/* Mobile/Tablet: CSS Grid with auto-wrap */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:hidden">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="w-full">
              <ProductCard product={product} variant="compact" className="h-full" />
            </div>
          ))}
        </div>

        {/* Desktop: Compact single row with horizontal scroll - like MedEasy */}
        {/* Cards use clamp() for responsive width: min 220px, preferred 20% of viewport, max 260px */}
        <div className="hidden lg:flex lg:w-full lg:gap-4 lg:overflow-x-auto lg:pb-2">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="flex-shrink-0" style={{ width: 'clamp(220px, 20vw, 260px)' }}>
              <ProductCard product={product} variant="compact" className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
