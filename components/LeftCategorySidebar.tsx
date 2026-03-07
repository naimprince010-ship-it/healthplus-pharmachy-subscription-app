import Link from 'next/link'
import { ChevronRight, Zap, TrendingUp, Star } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import PrescriptionSidebarButton from './PrescriptionSidebarButton'
import { getEffectivePrices } from '@/lib/pricing'

// Server component - fetches data on the server for instant loading
export default async function LeftCategorySidebar() {
  const [categories, trendingProducts] = await Promise.all([
    prisma.category.findMany({
      where: {
        showInSidebar: true,
        isActive: true,
      },
      orderBy: {
        sidebarOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sidebarIconUrl: true,
        sidebarLinkUrl: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        deletedAt: null,
      },
      take: 2,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        sellingPrice: true,
        mrp: true,
        discountPercentage: true,
        type: true,
      },
    })
  ])

  return (
    <div className="w-full space-y-4">
      {/* 1. Prescription Upload - Most Important CTA */}
      <PrescriptionSidebarButton />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* FLASH SALE Row */}
        <Link
          href="/flash-sale"
          className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-3.5 transition-all hover:from-orange-100 hover:to-red-100"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 shadow-sm animate-pulse">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-[15px] text-gray-900 tracking-tight">FLASH SALE</span>
          </div>
          <ChevronRight className="h-4 w-4 text-orange-400" />
        </Link>

        {/* Category List */}
        <div className="divide-y divide-gray-50">
          {categories.map((category) => {
            const href = category.sidebarLinkUrl || `/category/${category.slug}`

            return (
              <Link
                key={category.id}
                href={href}
                className="group flex items-center justify-between px-4 py-3.5 transition-all duration-200 hover:bg-teal-50/50"
              >
                <div className="flex items-center gap-3.5">
                  {category.sidebarIconUrl ? (
                    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-teal-100 group-hover:shadow-md">
                      <img
                        src={category.sidebarIconUrl}
                        alt={category.name}
                        className="h-full w-full object-cover p-1"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600 shadow-sm transition-all duration-300 group-hover:scale-110">
                      <span className="text-sm font-bold uppercase">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-[15px] font-semibold text-gray-700 transition-colors duration-200 group-hover:text-teal-700">
                    {category.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-teal-500" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* 3. Trending Products Section */}
      {trendingProducts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-bold text-gray-900">আপনার জন্য সেরা ডিল</h3>
          </div>
          <div className="grid gap-3">
            {trendingProducts.map((product) => {
              const pricing = getEffectivePrices({
                sellingPrice: Number(product.sellingPrice),
                mrp: product.mrp ? Number(product.mrp) : null,
                discountPercentage: product.discountPercentage ? Number(product.discountPercentage) : null,
              })

              return (
                <Link
                  key={product.id}
                  href={`/${product.type === 'MEDICINE' ? 'medicines' : 'products'}/${product.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all hover:border-teal-100 hover:shadow-md"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <Star className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-teal-700">
                      {product.name}
                    </h4>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-teal-600">৳{pricing.price.toFixed(0)}</span>
                      {pricing.discountPercent > 0 && (
                        <span className="text-[10px] text-gray-400 line-through">৳{pricing.mrp.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          <Link
            href="/products"
            className="block text-center text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
          >
            সব দেখুন →
          </Link>
        </div>
      )}
    </div>
  )
}
