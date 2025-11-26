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

export function ProductCard({ product }: { product: ProductCardProps }) {
  const href = product.href || `/products/${product.slug}`
  const medicineId = product.cartInfo?.kind === 'medicine' ? product.cartInfo.medicineId : undefined
  const productId = product.cartInfo?.kind === 'product' ? product.cartInfo.productId : product.id

  return (
    <Link
      href={href}
      className="group rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-lg"
    >
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
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

      <div className="mt-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        {product.brandName && (
          <p className="mt-1 text-sm text-gray-500">{product.brandName}</p>
        )}
        {product.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ৳{product.sellingPrice}
            </span>
            {product.mrp && product.mrp > product.sellingPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ৳{product.mrp}
              </span>
            )}
          </div>
        </div>
        <div className="mt-4" onClick={(e) => e.preventDefault()}>
          <AddToCartButton
            medicineId={medicineId}
            productId={productId}
            name={product.name}
            price={product.sellingPrice}
            image={product.imageUrl || undefined}
            stockQuantity={product.stockQuantity}
            category={product.category.name}
            type={product.type === 'MEDICINE' ? 'MEDICINE' : 'PRODUCT'}
            className="w-full"
          />
        </div>
      </div>
    </Link>
  )
}
