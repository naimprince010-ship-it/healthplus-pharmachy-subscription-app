'use client'

import Link from 'next/link'
import { Zap, ChevronRight, Baby, Cross, Droplets, Flame, Heart, Shield, Sparkles, Star } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { getStorefrontImageUrl } from '@/lib/image-url'

function getCategoryIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('face') || n.includes('skin') || n.includes('beauty')) return Sparkles
  if (n.includes('hair')) return Droplets
  if (n.includes('baby') || n.includes('kid') || n.includes('mom')) return Baby
  if (n.includes('fragrance') || n.includes('perfume')) return Flame
  if (n.includes('lip')) return Heart
  if (n.includes('oral')) return Cross
  if (n.includes('wellness') || n.includes('health')) return Shield
  return Star
}
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
  sizeLabel?: string | null
  packSize?: string | null
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
                className="group flex flex-col items-center gap-2 rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md hover:ring-primary/20 active:scale-[0.98]"
              >
                {gridImg ? (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
                    <img
                      src={gridImg}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                    {(() => {
                      const Icon = getCategoryIcon(category.name)
                      return <Icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                    })()}
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
              সবগুলো →
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    {(() => {
                      const Icon = getCategoryIcon(category.name)
                      return <Icon className="h-4 w-4 text-primary" />
                    })()}
                  </div>
                )
              })()}
              <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
            </div>
            <Link
              href={category.sidebarLinkUrl || `/category/${category.slug}`}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              সবগুলো →
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
