import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AddToCartButton } from '@/components/AddToCartButton'
import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ManufacturerPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ManufacturerPageProps): Promise<Metadata> {
  const { slug } = await params
  
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
    },
  })

  if (!manufacturer) {
    return {
      title: 'Manufacturer Not Found',
    }
  }

  return {
    title: `${manufacturer.name} - HealthPlus`,
    description: manufacturer.description || `Browse products from ${manufacturer.name} at HealthPlus`,
  }
}

export default async function ManufacturerPage({ params }: ManufacturerPageProps) {
  const { slug } = await params

  const manufacturer = await prisma.manufacturer.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      websiteUrl: true,
    },
  })

  if (!manufacturer) {
    notFound()
  }

  const products = await prisma.product.findMany({
    where: {
      manufacturerId: manufacturer.id,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      mrp: true,
      sellingPrice: true,
      stockQuantity: true,
      isFeatured: true,
      discountPercentage: true,
      type: true,
    },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 100,
  })

  return (
    <div className="bg-white py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Manufacturer Header */}
        <div className="mb-8">
          <nav className="mb-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-teal-600">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{manufacturer.name}</span>
          </nav>
          
          <div className="flex items-center gap-4">
            {manufacturer.logoUrl && (
              <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                <Image
                  src={manufacturer.logoUrl}
                  alt={manufacturer.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{manufacturer.name}</h1>
              {manufacturer.description && (
                <p className="mt-1 text-gray-600">{manufacturer.description}</p>
              )}
              {manufacturer.websiteUrl && (
                <a
                  href={manufacturer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                >
                  Visit Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            {products.length} products found
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No products found from this manufacturer</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((item) => {
              const detailPath = `/products/${item.slug}`
              
              const hasDiscount = item.discountPercentage && item.discountPercentage > 0
              const discountedPrice = hasDiscount 
                ? item.sellingPrice * (1 - (item.discountPercentage || 0) / 100)
                : item.sellingPrice

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-lg border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link href={detailPath} className="flex-1">
                    <div className="relative mb-4 h-48 overflow-hidden rounded-lg bg-gray-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                      {hasDiscount && (
                        <span className="absolute left-2 top-2 z-10 rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                          {Math.round(item.discountPercentage || 0)}% OFF
                        </span>
                      )}
                      {item.isFeatured && !hasDiscount && (
                        <span className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-semibold text-gray-900">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      {item.name}
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          ৳{discountedPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-gray-500 line-through">
                            ৳{item.sellingPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.stockQuantity === 0 && (
                      <p className="mt-2 text-xs text-red-600">Out of stock</p>
                    )}
                  </Link>
                  <div className="mt-4">
                    <AddToCartButton
                      productId={item.id}
                      name={item.name}
                      price={discountedPrice}
                      image={item.imageUrl || undefined}
                      stockQuantity={item.stockQuantity}
                      className="w-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
