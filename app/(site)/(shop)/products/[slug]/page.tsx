import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/ProductDetailClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const { prisma } = await import('@/lib/prisma')
    
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        name: true,
      },
    })

    if (!product) {
      return {}
    }

    return {
      title: product.name,
      alternates: {
        canonical: `/products/${slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const { prisma } = await import('@/lib/prisma')

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      sellingPrice: true,
      mrp: true,
      stockQuantity: true,
      brandName: true,
      description: true,
      keyFeatures: true,
      specSummary: true,
      sizeLabel: true,
      unit: true,
      type: true,
      isActive: true,
      discountPercentage: true,
      flashSalePrice: true,
      flashSaleStart: true,
      flashSaleEnd: true,
      isFlashSale: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      medicine: {
        select: {
          discountPercentage: true,
        },
      },
    },
  })

  if (!product || !product.isActive) {
    notFound()
  }

  const sellingPrice = Number(product.sellingPrice)
  const mrp = product.mrp ? Number(product.mrp) : null
  const stockQuantity = Number(product.stockQuantity)
  // Use product's discountPercentage, or fall back to linked medicine's discountPercentage
  const rawDiscount = product.discountPercentage || product.medicine?.discountPercentage
  const discountPercentage = rawDiscount ? Number(rawDiscount) : null

  return (
    <div className="bg-gray-50 py-8">
      {/* Content fills the shop layout container - no additional max-width needed */}
      <div className="w-full px-2 sm:px-4 lg:px-0">
        <Link
          href={product.category?.slug ? `/category/${product.category.slug}` : '/products'}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {product.category?.name ? `Back to ${product.category.name}` : 'Back to Products'}
        </Link>

        {/* Two-column layout: 55% image + 45% info */}
        <div className="mt-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Image container - 55% width on lg screens */}
          <div className="w-full lg:w-[55%]">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-white">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
          </div>

          {/* Details container - 45% width on lg screens */}
          <div className="w-full lg:w-[45%]">
            {product.category && (
              <div className="mb-2">
                <Link
                  href={`/products?categoryId=${product.category.id}`}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  {product.category.name}
                </Link>
              </div>
            )}

            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
                {product.name}
                {product.sizeLabel && (
                  <span className="ml-2 text-lg font-normal text-gray-500">
                    {product.sizeLabel}
                  </span>
                )}
              </h1>
            </div>

            {product.brandName && (
              <div className="mb-6 flex items-center gap-2">
                <span className="text-sm text-gray-500">Manufacturer:</span>
                <span className="rounded bg-yellow-100 px-2 py-0.5 text-sm font-medium text-gray-900">
                  {product.brandName}
                </span>
              </div>
            )}

            <ProductDetailClient
              productId={product.id}
              name={product.name}
              sellingPrice={sellingPrice}
              mrp={mrp}
              stockQuantity={stockQuantity}
              imageUrl={product.imageUrl}
              category={product.category?.name ?? 'General'}
              unit={product.unit}
              discountPercentage={discountPercentage}
              flashSalePrice={product.flashSalePrice}
              flashSaleStart={product.flashSaleStart}
              flashSaleEnd={product.flashSaleEnd}
              isFlashSale={product.isFlashSale}
              slug={slug}
            />

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
                  {(product.keyFeatures?.split('\n') ?? []).filter(f => f.trim()).map((feature, index) => (
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
                  <dd className="font-medium text-gray-900">{product.category?.name ?? 'Uncategorized'}</dd>
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
                  <dd className={`font-medium ${stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
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
