import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { ManufacturerPageClient } from './ManufacturerPageClient'
import { getEffectivePrices } from '@/lib/pricing'

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
      phoneNumber: true,
    },
  })

  if (!manufacturer) {
    notFound()
  }

  // Fetch all products from this manufacturer with category info and order counts
  const allProducts = await prisma.product.findMany({
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
      brandName: true,
      createdAt: true,
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
      _count: {
        select: {
          orderItems: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Map products with effective prices pre-computed on server
  const productsWithPrices = allProducts.map((product) => {
    const computed = getEffectivePrices({
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      discountPercentage: product.discountPercentage,
      flashSalePrice: product.flashSalePrice,
      flashSaleStart: product.flashSaleStart,
      flashSaleEnd: product.flashSaleEnd,
      isFlashSale: product.isFlashSale,
    })

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      imageUrl: product.imageUrl,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      isFeatured: product.isFeatured,
      discountPercentage: product.discountPercentage,
      type: product.type as 'MEDICINE' | 'GENERAL',
      brandName: product.brandName,
      createdAt: product.createdAt.toISOString(),
      orderCount: product._count.orderItems,
      category: product.category || { id: '', name: 'Uncategorized', slug: '' },
      effectivePrice: computed.price,
      effectiveMrp: computed.mrp,
      effectiveDiscountPercent: computed.discountPercent,
      isFlashSaleActive: computed.isFlashSale,
    }
  })

  // Best Selling Products: sorted by order count (desc), take top 10
  const bestSellingProducts = [...productsWithPrices]
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10)

  // Newly Launched Items: sorted by createdAt (desc), take top 10
  const newlyLaunchedProducts = [...productsWithPrices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  // Get unique categories from all products for filter chips
  const categoriesMap = new Map<string, { id: string; name: string; slug: string }>()
  productsWithPrices.forEach((product) => {
    if (product.category && product.category.id) {
      categoriesMap.set(product.category.id, product.category)
    }
  })
  const categories = Array.from(categoriesMap.values())

  return (
    <div className="bg-white py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-teal-600">Home</Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900">{manufacturer.name}</span>
        </nav>

        {/* Manufacturer Header */}
        <div className="mb-8">
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
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {manufacturer.websiteUrl && (
                  <a
                    href={manufacturer.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                  >
                    Visit Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {manufacturer.phoneNumber && (
                  <span className="text-sm text-gray-600">
                    Contact:{' '}
                    <a
                      href={`tel:${manufacturer.phoneNumber}`}
                      className="text-teal-600 hover:text-teal-700"
                    >
                      {manufacturer.phoneNumber}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client component for interactive sections */}
        <ManufacturerPageClient
          bestSellingProducts={bestSellingProducts}
          newlyLaunchedProducts={newlyLaunchedProducts}
          allProducts={productsWithPrices}
          categories={categories}
          manufacturerName={manufacturer.name}
        />
      </div>
    </div>
  )
}
