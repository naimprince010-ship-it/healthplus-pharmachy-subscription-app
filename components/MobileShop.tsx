'use client'

import Link from 'next/link'
import { Zap, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { categoryPlaceholderLetter } from '@/lib/category-placeholder'
import { getStorefrontImageUrl } from '@/lib/image-url'

export interface MobileShopProduct {
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

export interface MobileShopCategory {
  id: string
  name: string
  slug: string
  /** Square thumbnail for mobile category grid; overrides category imageUrl when set */
  sidebarIconUrl: string | null
  /** Category banner/header image; used for grid when sidebar icon is empty */
  imageUrl?: string | null
  sidebarLinkUrl: string | null
}

export interface MobileShopCategorySection {
  category: MobileShopCategory
  products: MobileShopProduct[]
}

interface MobileShopProps {
  /** Shown first: grid of category shortcuts (replaces desktop sidebar on mobile). */
  categoryGrid: MobileShopCategory[]
  flashSaleProducts: MobileShopProduct[]
  categorySections: MobileShopCategorySection[]
}

function categoryHref(c: MobileShopCategory) {
  return c.sidebarLinkUrl?.trim() || `/category/${c.slug}`
}

function categoryGridImageUrl(c: MobileShopCategory): string | null {
  return getStorefrontImageUrl(c.sidebarIconUrl || c.imageUrl || null)
}

export function MobileShop({ categoryGrid, flashSaleProducts, categorySections }: MobileShopProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1) Category grid first — no sidebar on mobile / webapp */}
      {categoryGrid.length > 0 && (
        <section className="border-b border-gray-100 py-4">
          <h2 className="mb-3 px-4 text-lg font-bold text-gray-900">Categories</h2>
          <div className="grid grid-cols-3 gap-3 px-4 sm:grid-cols-4">
            {categoryGrid.map((category) => {
              const gridImg = categoryGridImageUrl(category)
              return (
              <Link
                key={category.id}
                href={categoryHref(category)}
                className="flex flex-col items-center gap-2 rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100 active:scale-[0.98] active:opacity-90"
              >
                {gridImg ? (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={gridImg}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100">
                    <span className="text-lg font-bold text-teal-700" aria-hidden>
                      {categoryPlaceholderLetter(category.name)}
                    </span>
                  </div>
                )}
                <span className="line-clamp-2 min-h-8 text-xs font-medium leading-tight text-gray-800">
                  {category.name}
                </span>
              </Link>
            )
            })}
          </div>
        </section>
      )}

      {/* 2) Flash sale */}
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

      {/* 3) Product rows by category */}
      {categorySections.map(({ category, products }) => (
        <section key={category.id} className="py-4">
          <div className="mb-3 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              {(() => {
                const thumb = getStorefrontImageUrl(category.sidebarIconUrl || category.imageUrl || null)
                return thumb ? (
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                    <img
                      src={thumb}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                    <span className="text-xs font-semibold text-teal-600" aria-hidden>
                      {categoryPlaceholderLetter(category.name)}
                    </span>
                  </div>
                )
              })()}
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

      {categoryGrid.length === 0 && categorySections.length === 0 && flashSaleProducts.length === 0 && (
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
