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
    <section className="pt-4 pb-4" style={bgStyle}>
      <div className="px-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
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
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            See all →
          </Link>
        </div>

        {/* Responsive grid layout - fills available width, left-aligned, auto-fit columns */}
        <div 
          className="grid gap-3 items-start"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          {products.slice(0, 12).map((product) => (
            <ProductCard key={product.id} product={product} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  )
}
