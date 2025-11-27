'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) {
    return null
  }

  const bgStyle = section.bgColor ? { backgroundColor: section.bgColor } : {}

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="py-4" style={bgStyle}>
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
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            সবগুলো দেখুন
          </Link>
        </div>

        {/* MedEasy-style horizontal scroll with arrow buttons - 10 products per section */}
        <div className="relative">
          {/* Left scroll arrow - desktop only */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-lg transition-all hover:bg-gray-100 lg:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          {/* Product scroll container */}
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-hide lg:px-8"
          >
            {products.slice(0, 10).map((product) => (
              <div key={product.id} className="flex-shrink-0" style={{ width: 'clamp(170px, 16vw, 230px)' }}>
                <ProductCard product={product} variant="compact" className="h-full" />
              </div>
            ))}
          </div>

          {/* Right scroll arrow - desktop only */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-lg transition-all hover:bg-gray-100 lg:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  )
}
