import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'

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
}

export function ProductCard({ product, variant = 'default' }: ProductCardComponentProps) {
  const href = product.href || `/products/${product.slug}`
  const medicineId = product.cartInfo?.kind === 'medicine' ? product.cartInfo.medicineId : undefined
  const productId = product.cartInfo?.kind === 'product' ? product.cartInfo.productId : product.id

  const isCompact = variant === 'compact'

  // Calculate discount percentage for compact variant
  const discountPercent = product.mrp && product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : null

  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg ${
        isCompact ? 'p-2' : 'p-4'
      }`}
    >
      {/* Discount badge for compact variant */}
      {isCompact && discountPercent && discountPercent > 0 && (
        <div className="absolute left-2 top-2 z-10 rounded bg-teal-600 px-2 py-0.5 text-xs font-semibold text-white">
          {discountPercent}% OFF
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
              ৳{product.sellingPrice}
            </span>
            {product.mrp && product.mrp > product.sellingPrice && (
              <span className={`text-gray-500 line-through ${isCompact ? 'text-xs' : 'text-sm'}`}>
                ৳{product.mrp}
              </span>
            )}
          </div>
        </div>
        <div className={`mt-auto ${isCompact ? 'pt-2' : 'pt-4'}`} onClick={(e) => e.preventDefault()}>
          <AddToCartButton
            medicineId={medicineId}
            productId={productId}
            name={product.name}
            price={product.sellingPrice}
            image={product.imageUrl || undefined}
            stockQuantity={product.stockQuantity}
            category={product.category.name}
            type={product.type === 'MEDICINE' ? 'MEDICINE' : 'PRODUCT'}
            className={`w-full ${isCompact ? 'py-1.5 text-sm' : ''}`}
          />
        </div>
      </div>
    </Link>
  )
}
