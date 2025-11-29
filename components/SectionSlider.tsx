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

  // On desktop, use white background to keep sections compact like MedEasy
  // On mobile/tablet, use the section's background color for visual separation
  const desktopBgClass = section.bgColor ? 'lg:!bg-white' : ''

  return (
    // Full-width section with responsive background color
    <section 
      className={`w-full py-4 lg:py-2 ${desktopBgClass}`}
      style={section.bgColor ? { backgroundColor: section.bgColor } : {}}
    >
      {/* Full-width content - lg:px-0 to avoid double padding on desktop */}
      <div className="w-full px-2 sm:px-4 lg:px-0">
        <div className="mb-3 flex items-center justify-between lg:px-4">
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
        {/* Container: flex row nowrap, overflow-x auto, px-4 (16px), gap-4 (16px) */}
        {/* Cards: flex 0 0 196px, min-width 190px - shows 5-6 cards + partial on ~1365px screen */}
        <div className="hidden lg:flex lg:w-full lg:flex-nowrap lg:gap-4 lg:overflow-x-auto lg:px-4 lg:pb-2">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="shrink-0 flex-[0_0_196px] min-w-[190px]">
              <ProductCard product={product} variant="compact" className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
