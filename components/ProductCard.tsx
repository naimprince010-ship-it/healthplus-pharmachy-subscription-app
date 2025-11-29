import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'
import { getEffectivePrices } from '@/lib/pricing'

interface ProductCardProps {
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
}

export function ProductCard({ product, variant = 'default', className = '' }: ProductCardComponentProps) {
  const href = product.href || `/products/${product.slug}`
  const medicineId = product.cartInfo?.kind === 'medicine' ? product.cartInfo.medicineId : undefined
  const productId = product.cartInfo?.kind === 'product' ? product.cartInfo.productId : product.id

  const isCompact = variant === 'compact'

  // Use pre-computed values from server if available (avoids hydration mismatch)
  // Fall back to computing on client for pages that don't pre-compute
  let price: number
  let mrp: number
  let discountPercent: number
  let isFlashSale: boolean
  
  if (product.effectivePrice !== undefined) {
    // Use pre-computed values from server
    price = product.effectivePrice
    mrp = product.effectiveMrp ?? product.mrp ?? product.sellingPrice
    discountPercent = product.effectiveDiscountPercent ?? 0
    isFlashSale = product.isFlashSaleActive ?? false
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
    })
    price = computed.price
    mrp = computed.mrp
    discountPercent = computed.discountPercent
    isFlashSale = computed.isFlashSale
  }
  
  const hasDiscount = discountPercent > 0

  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg ${
        isCompact ? 'p-3 lg:p-4' : 'p-4'
      } ${className}`}
    >
      {/* Discount badge */}
      {hasDiscount && (
        <div className={`absolute left-2 top-2 z-10 rounded px-2 py-0.5 text-xs font-semibold text-white ${isFlashSale ? 'bg-orange-500' : 'bg-red-500'}`}>
          {discountPercent}% {isFlashSale ? 'OFF' : 'ডিস্কাউন্ট'}
        </div>
      )}

      <div className={`overflow-hidden rounded-lg bg-gray-100 ${isCompact ? 'aspect-[4/3]' : 'aspect-square'}`}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${isCompact ? 'mt-2' : 'mt-4'}`}>
        <h3 className={`font-semibold text-gray-900 line-clamp-2 ${isCompact ? 'text-sm' : ''}`}>
          {product.name}
        </h3>
        {product.brandName && (
          <p className={`text-gray-500 ${isCompact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'}`}>
            {product.brandName}
          </p>
        )}
        {/* Only show description in default variant */}
        {!isCompact && product.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className={`flex items-center ${isCompact ? 'mt-1' : 'mt-3'}`}>
          <div className="flex flex-wrap items-baseline gap-1">
            <span className={`font-bold text-gray-900 ${isCompact ? 'text-sm' : 'text-lg'}`}>
              ৳{price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className={`text-gray-500 line-through ${isCompact ? 'text-xs' : 'text-sm'}`}>
                ৳{mrp.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <div className={`mt-auto ${isCompact ? 'pt-2' : 'pt-4'}`} onClick={(e) => e.preventDefault()}>
          <AddToCartButton
            medicineId={medicineId}
            productId={productId}
            name={product.name}
            price={price}
            image={product.imageUrl || undefined}
            stockQuantity={product.stockQuantity}
            category={product.category.name}
            mrp={mrp}
            slug={product.slug}
            type={product.type === 'MEDICINE' ? 'MEDICINE' : 'PRODUCT'}
            className={`w-full ${isCompact ? 'py-1.5 text-sm' : ''}`}
          />
        </div>
      </div>
    </Link>
  )
}
