'use client'

import { ProductCard } from '@/components/ProductCard'
import { SectionHeader } from '@/components/HomeCuratedSections'

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
  sizeLabel?: string | null
  packSize?: string | null
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
        <div className="lg:px-4"><SectionHeader title={section.title} subtitle={section.badgeText} href={`/sections/${section.slug}`} /></div>

        {/* Mobile/Tablet: CSS Grid with auto-wrap */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:hidden">
          {products.slice(0, 12).map((product, idx) => (
            <div key={product.id} className="w-full">
              <ProductCard product={product} variant="compact" className="h-full" imagePriority={idx < 4} />
            </div>
          ))}
        </div>

        {/* Desktop: Compact single row with horizontal scroll - like MedEasy */}
        {/* Container: flex row nowrap, overflow-x auto, px-4 (16px), gap-4 (16px) */}
        {/* Cards: flex 0 0 196px, min-width 190px - shows 5-6 cards + partial on ~1365px screen */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4 lg:px-4 lg:pb-2">
          {products.slice(0, 10).map((product, idx) => (
            <div key={product.id}>
              <ProductCard product={product} variant="compact" className="h-full" imagePriority={idx < 5} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
