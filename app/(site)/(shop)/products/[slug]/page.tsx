import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AddToCartButton } from '@/components/AddToCartButton'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      canonicalUrl: true,
      seoTitle: true,
      seoDescription: true,
    },
  })

  if (!product) {
    return {}
  }

  const canonicalUrl = product.canonicalUrl || `/products/${slug}`

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || undefined,
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!product || !product.isActive) {
    notFound()
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>

          <div>
            <div className="mb-4">
              <Link
                href={`/products?categoryId=${product.category.id}`}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                {product.category.name}
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {product.brandName && (
              <p className="mt-2 text-lg text-gray-600">by {product.brandName}</p>
            )}

            {product.sizeLabel && (
              <p className="mt-2 text-sm text-gray-500">{product.sizeLabel}</p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ৳{product.sellingPrice.toFixed(2)}
              </span>
              {product.mrp && product.mrp > product.sellingPrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ৳{product.mrp.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                    Save ৳{(product.mrp - product.sellingPrice).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            <div className="mt-6">
              <AddToCartButton
                productId={product.id}
                name={product.name}
                price={product.sellingPrice}
                image={product.imageUrl || undefined}
                stockQuantity={product.stockQuantity}
                category={product.category.name}
                type="PRODUCT"
                className="px-8 py-3"
              />
            </div>

            {product.stockQuantity > 0 && product.stockQuantity < 10 && (
              <p className="mt-4 text-sm text-orange-600">
                Only {product.stockQuantity} left in stock!
              </p>
            )}

            {product.description && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">Description</h2>
                <p className="mt-4 text-gray-600 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {product.keyFeatures && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
                <div className="mt-4 space-y-2">
                  {product.keyFeatures.split('\n').filter(f => f.trim()).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-600" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.specSummary && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">Specifications</h2>
                <p className="mt-4 text-gray-600 whitespace-pre-line">
                  {product.specSummary}
                </p>
              </div>
            )}

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">Product Information</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Category</dt>
                  <dd className="font-medium text-gray-900">{product.category.name}</dd>
                </div>
                {product.brandName && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Brand</dt>
                    <dd className="font-medium text-gray-900">{product.brandName}</dd>
                  </div>
                )}
                {product.unit && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Unit</dt>
                    <dd className="font-medium text-gray-900">{product.unit}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Availability</dt>
                  <dd className={`font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
