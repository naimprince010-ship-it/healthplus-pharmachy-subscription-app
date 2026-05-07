'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { AddToCartButton } from '@/components/AddToCartButton'
import { getEffectivePrices } from '@/lib/pricing'
import { getStorefrontImageUrl } from '@/lib/image-url'

export interface ProductCardProps {
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
  campaignPrice?: number | null
  campaignStart?: Date | string | null
  campaignEnd?: Date | string | null
  requiresPrescription?: boolean
  genericName?: string | null
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
  /** e.g. "100ml", "539g" — shown on its own line so the title can stay short. */
  sizeLabel?: string | null
  /** Medicine pack line when linked to Medicine row */
  packSize?: string | null
  href?: string
  cartInfo?: {
    kind: 'medicine' | 'product'
    medicineId?: string
    productId?: string
  }
}

interface ProductCardComponentProps {
  product: ProductCardProps
  variant?: 'default' | 'compact'
  className?: string
  /** First above-the-fold cards only — boosts LCP via next/image preload (few per viewport). */
  imagePriority?: boolean
  /** Use outline cart CTA — better visual balance on dense grids (e.g. search). */
  cartButtonVariant?: 'solid' | 'outline'
}

export function ProductCard({
  product,
  variant = 'default',
  className = '',
  imagePriority = false,
  cartButtonVariant,
}: ProductCardComponentProps) {
  const href =
    product.href ||
    (product.type === 'MEDICINE' ? `/medicines/${product.slug}` : `/products/${product.slug}`)

  let medicineId: string | undefined
  let productId: string | undefined
  if (product.cartInfo?.kind === 'medicine') {
    medicineId = product.cartInfo.medicineId
  } else if (product.cartInfo?.kind === 'product') {
    productId = product.cartInfo.productId
  } else if (product.type === 'MEDICINE') {
    medicineId = product.id
  } else {
    productId = product.id
  }

  const isCompact = variant === 'compact'
  const displayImageUrl = getStorefrontImageUrl(product.imageUrl)
  const sizeDisplay = product.sizeLabel?.trim() || product.packSize?.trim() || null

  // Use pre-computed values from server if available (avoids hydration mismatch)
  // Fall back to computing on client for pages that don't pre-compute
  let price: number
  let mrp: number
  let discountPercent: number
  let showOrangeOffBadge: boolean

  if (product.effectivePrice !== undefined) {
    // Use pre-computed values from server
    price = product.effectivePrice
    mrp = product.effectiveMrp ?? product.mrp ?? product.sellingPrice
    discountPercent = product.effectiveDiscountPercent ?? 0
    showOrangeOffBadge = product.isFlashSaleActive ?? false
  } else {
    // Fall back to computing on client (for pages that don't pre-compute)
    const computed = getEffectivePrices({
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      discountPercentage: product.discountPercentage,
      flashSalePrice: product.flashSalePrice,
      flashSaleStart: product.flashSaleStart,
      flashSaleEnd: product.flashSaleEnd,
      isFlashSale: product.isFlashSale,
      campaignPrice: product.campaignPrice,
      campaignStart: product.campaignStart,
      campaignEnd: product.campaignEnd,
    })
    price = computed.price
    mrp = computed.mrp
    discountPercent = computed.discountPercent
    showOrangeOffBadge = computed.isFlashSale || computed.isCampaign
  }

  const hasDiscount = discountPercent > 0

  const isHygieneProduct = 
    product.category.name.toLowerCase().includes('women') || 
    product.category.name.toLowerCase().includes('hygiene') ||
    product.name.toLowerCase().includes('pad') ||
    product.name.toLowerCase().includes('napkin') ||
    product.name.toLowerCase().includes('senora') ||
    product.name.toLowerCase().includes('joya') ||
    product.name.toLowerCase().includes('freedom')

  return (
    <Link
      href={href}
      prefetch
      className={`group relative flex min-h-0 h-full w-full min-w-0 flex-col rounded-xl border border-gray-100 bg-white transition-[transform,box-shadow] duration-300 ease-out hover:border-emerald-200/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 ${
        isCompact ? 'p-3 lg:p-[14px]' : 'p-4'
      } ${className}`}
    >
      {/* Discount badge */}
      {hasDiscount && (
        <div className={`absolute left-3 top-3 z-10 rounded bg-cta px-2 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-sm`}>
          {discountPercent}% {showOrangeOffBadge ? 'OFF' : 'ডিস্কাউন্ট'}
        </div>
      )}

      {/* Discreet Packaging badge */}
      {isHygieneProduct && (
        <div className={`absolute ${hasDiscount ? 'top-10' : 'top-3'} left-3 z-10 rounded-full bg-pink-500/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm flex items-center gap-1 backdrop-blur-sm`}>
          <span aria-hidden="true">🔒</span> Privacy
        </div>
      )}

      {/* Low stock urgency badge */}
      {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
          ⚠️ মাত্র {product.stockQuantity}টি বাকি
        </div>
      )}

      <div
        className="relative aspect-square shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-slate-100 to-slate-50 ring-1 ring-inset ring-slate-200/80"
      >
        {displayImageUrl ? (
          <Image
            src={displayImageUrl}
            alt={product.name}
            fill
            priority={imagePriority}
            sizes={
              isCompact
                ? '(max-width: 768px) 50vw, 190px'
                : '(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px'
            }
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-slate-400" aria-hidden>
            <ImageOff className="h-8 w-8 opacity-50" strokeWidth={1.25} />
            <span className="text-center text-[10px] font-medium uppercase tracking-wide text-slate-500">
              ছবি নেই
            </span>
          </div>
        )}
        {product.requiresPrescription && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            Rx
          </span>
        )}
      </div>

      {/* Title: truncated; size on its own line (sizeLabel / packSize) */}
      <div className={`flex min-h-0 flex-1 flex-col ${isCompact ? 'mt-2.5' : 'mt-3'}`}>
        <h3
          className={`shrink-0 font-semibold leading-snug text-slate-900 ${
            isCompact ? 'line-clamp-3 text-[13px] sm:text-sm' : 'line-clamp-2 text-[13.5px]'
          } ${isCompact ? 'min-h-[3.75rem] sm:min-h-[2.625rem]' : 'min-h-[2.75rem]'}`}
        >
          {product.name}
        </h3>
        {sizeDisplay && (
          <p
            className={`shrink-0 font-medium text-gray-600 line-clamp-1 ${
              isCompact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-xs'
            }`}
            title={sizeDisplay}
          >
            {sizeDisplay}
          </p>
        )}
        {/* Brand: 1 line only */}
        {product.brandName && (
          <p className={`line-clamp-1 text-gray-400 shrink-0 ${isCompact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-xs'}`}>
            {product.brandName}
          </p>
        )}

        {/* Price — pushed to bottom via mt-auto */}
        <div className="mt-auto pt-1">
          <div className={`flex flex-wrap items-baseline gap-1.5 ${isCompact ? 'mt-2' : 'mt-2'}`}>
            <span
              className={`font-bold tabular-nums text-emerald-800 ${isCompact ? 'text-base' : 'text-[17px]'}`}
            >
              ৳{price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className={`font-medium text-gray-400 line-through ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
                ৳{mrp.toFixed(2)}
              </span>
            )}
          </div>

          {/* Button */}
          <div className={`${isCompact ? 'pt-2 pb-1.5' : 'pt-2 pb-1'}`} onClick={(e) => e.preventDefault()}>
            <AddToCartButton
              medicineId={medicineId}
              productId={productId}
              name={product.name}
              price={price}
              image={displayImageUrl || undefined}
              requiresPrescription={product.requiresPrescription}
              stockQuantity={product.stockQuantity}
              category={product.category.name}
              genericName={product.genericName ?? undefined}
              mrp={mrp}
              slug={product.slug}
              type={product.type === 'MEDICINE' ? 'MEDICINE' : 'PRODUCT'}
              variant={cartButtonVariant}
              className={`w-full ${isCompact ? '' : 'py-2'} ${cartButtonVariant === 'outline' && isCompact ? 'min-h-[2.25rem]' : ''}`}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
