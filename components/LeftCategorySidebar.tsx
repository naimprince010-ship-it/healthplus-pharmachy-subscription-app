import Link from 'next/link'
import {
  Baby,
  ChevronRight,
  Cross,
  Droplets,
  Flame,
  Heart,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import PrescriptionSidebarButton from './PrescriptionSidebarButton'
import { getEffectivePrices } from '@/lib/pricing'
import {
  GROCERY_CATEGORY_SLUG,
  isGroceryShopEnabled,
  isMedicineShopEnabled,
  isPrescriptionFlowEnabled,
} from '@/lib/site-features'

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
        isMedicineCategory: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        deletedAt: null,
        ...(!isMedicineShopEnabled() ? { type: 'GENERAL' as const } : {}),
        ...(!isGroceryShopEnabled()
          ? { NOT: { category: { slug: GROCERY_CATEGORY_SLUG } } }
          : {}),
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
        stockQuantity: true,
      },
    })
  ])

  const navCategories = categories.filter((c) => {
    if (!isMedicineShopEnabled() && c.isMedicineCategory) return false
    if (!isGroceryShopEnabled() && c.slug === GROCERY_CATEGORY_SLUG) return false
    return true
  })

  return (
    <div className="w-full space-y-4">
      {isPrescriptionFlowEnabled() && <PrescriptionSidebarButton />}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* FLASH SALE Row */}
        <Link
          href="/flash-sale"
          className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 transition-all hover:from-orange-600 hover:to-red-600"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="font-extrabold text-[14px] text-white tracking-widest uppercase">Flash Sale</span>
          </div>
          <ChevronRight className="h-4 w-4 text-white/70" />
        </Link>

        {/* Category header */}
        <div className="flex items-center justify-between border-b border-gray-50 px-4 py-2.5 bg-gray-50/60">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">ক্যাটাগরি</span>
        </div>

        {/* Category List */}
        <div className="divide-y divide-gray-50/80">
          {navCategories.map((category) => {
            const href = category.sidebarLinkUrl || `/category/${category.slug}`
            const Icon = getCategoryIcon(category.name)
            return (
              <Link
                key={category.id}
                href={href}
                className="group relative flex items-center justify-between px-3 py-2.5 transition-all duration-200 hover:bg-teal-50/60"
              >
                {/* teal left accent on hover */}
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-200 group-hover:bg-teal-100">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[13.5px] font-medium text-gray-700 transition-colors duration-200 group-hover:text-teal-700">
                    {category.name}
                  </span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-teal-400" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* সেরা ডিল */}
      {trendingProducts.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-gray-50 bg-gray-50/60 px-4 py-2.5">
            <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">সেরা ডিল</h3>
          </div>

          <div className="divide-y divide-gray-50/80">
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
                  className="group flex items-center gap-3 p-3 transition-all hover:bg-teal-50/50"
                >
                  {/* Image */}
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <Star className="h-5 w-5" />
                      </div>
                    )}
                    {pricing.discountPercent > 0 && (
                      <span className="absolute left-0 top-0 rounded-br-lg bg-red-500 px-1 py-0.5 text-[8px] font-bold text-white leading-tight">
                        -{pricing.discountPercent.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold leading-snug text-gray-800 group-hover:text-teal-700">
                      {product.name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-teal-600">৳{pricing.price.toFixed(0)}</span>
                      {pricing.discountPercent > 0 && (
                        <span className="text-[10px] text-gray-400 line-through">৳{pricing.mrp.toFixed(0)}</span>
                      )}
                    </div>
                    {product.stockQuantity !== null && product.stockQuantity !== undefined && (
                      <p className={`mt-0.5 text-[10px] font-medium ${product.stockQuantity <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                        {product.stockQuantity <= 0 ? 'স্টক নেই' : product.stockQuantity <= 5 ? `মাত্র ${product.stockQuantity}টি বাকি` : 'স্টকে আছে'}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          <Link href="/products" className="flex items-center justify-center gap-1 border-t border-gray-50 py-2.5 text-[12px] font-bold text-teal-600 transition-colors hover:bg-teal-50 hover:text-teal-700">
            সব দেখুন <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
