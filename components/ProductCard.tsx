'use client'

import Link from 'next/link'
import Image from 'next/image'
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
}

export function ProductCard({
  product,
  variant = 'default',
  className = '',
  imagePriority = false,
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

  return (
    <Link
      href={href}
      prefetch
      className={`group relative flex flex-col rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg ${
        isCompact ? 'p-3 lg:p-4' : 'p-4'
      } ${className}`}
    >
      {/* Discount badge */}
      {hasDiscount && (
        <div className={`absolute left-2 top-2 z-10 rounded px-2 py-0.5 text-xs font-semibold text-white ${showOrangeOffBadge ? 'bg-orange-500' : 'bg-red-500'}`}>
          {discountPercent}% {showOrangeOffBadge ? 'OFF' : 'ডিস্কাউন্ট'}
        </div>
      )}

      <div
        className={`relative overflow-hidden rounded-lg bg-gray-100 ${isCompact ? 'aspect-[4/3]' : 'aspect-square'}`}
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
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
        {product.requiresPrescription && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            Rx
          </span>
        )}
      </div>

      {/* Fixed-height text area so price & button are always at same position */}
      <div className={`flex flex-1 flex-col ${isCompact ? 'mt-2' : 'mt-3'}`}>
        {/* Name: always exactly 2 lines tall */}
        <h3 className={`font-semibold text-gray-900 line-clamp-2 leading-snug ${
          isCompact ? 'text-sm' : 'text-[13.5px]'
        }`} style={{ minHeight: isCompact ? '2.5rem' : '2.75rem' }}>
          {product.name}
        </h3>
        {/* Brand: 1 line only */}
        {product.brandName && (
          <p className={`line-clamp-1 text-gray-400 ${isCompact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-xs'}`}>
            {product.brandName}
          </p>
        )}

        {/* Price — pushed to bottom via mt-auto */}
        <div className="mt-auto">
          <div className={`flex flex-wrap items-baseline gap-1 ${isCompact ? 'mt-2' : 'mt-2'}`}>
            <span className={`font-bold text-teal-700 ${isCompact ? 'text-sm' : 'text-base'}`}>
              ৳{price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className={`text-gray-400 line-through ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
                ৳{mrp.toFixed(2)}
              </span>
            )}
          </div>

          {/* Button */}
          <div className={`${isCompact ? 'pt-1.5' : 'pt-2'}`} onClick={(e) => e.preventDefault()}>
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
              className={`w-full ${isCompact ? 'py-1.5 text-xs' : 'py-2'}`}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
