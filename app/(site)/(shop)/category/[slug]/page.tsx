import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AddToCartButton } from '@/components/AddToCartButton'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  
  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
    },
  })

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${category.name} - HealthPlus`,
    description: category.description || `Browse ${category.name} products at HealthPlus`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      isMedicineCategory: true,
      isActive: true,
    },
  })

  if (!category || !category.isActive) {
    notFound()
  }

  let items: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    imagePath?: string | null
    mrp: number | null
    sellingPrice: number
    stockQuantity: number
    isFeatured: boolean
    requiresPrescription?: boolean
    genericName?: string | null
    strength?: string | null
    discountPercentage?: number | null
  }> = []

  if (category.isMedicineCategory) {
    const medicines = await prisma.medicine.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        imagePath: true,
        mrp: true,
        sellingPrice: true,
        stockQuantity: true,
        isFeatured: true,
        requiresPrescription: true,
        genericName: true,
        strength: true,
        discountPercentage: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    })

    items = medicines.map((m) => ({
      ...m,
      imageUrl: m.imageUrl || (m.imagePath
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/medicine-images/${m.imagePath}`
        : null),
    }))
  } else {
    const products = await prisma.product.findMany({
      where: {
        categoryId: category.id,
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
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    })

    items = products.map((p) => ({
      ...p,
      requiresPrescription: false,
      discountPercentage: p.discountPercentage,
    }))
  }

  return (
    <div className="bg-white py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Category Header */}
        <div className="mb-8">
          <nav className="mb-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-teal-600">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{category.name}</span>
          </nav>
          
          <div className="flex items-center gap-4">
            {category.imageUrl && (
              <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="mt-1 text-gray-600">{category.description}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            {items.length} {category.isMedicineCategory ? 'medicines' : 'products'} found
          </div>
        </div>

        {/* Products Grid */}
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No {category.isMedicineCategory ? 'medicines' : 'products'} found in this category</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => {
              const detailPath = category.isMedicineCategory 
                ? `/medicines/${item.slug}` 
                : `/products/${item.slug}`
              
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
                          {Math.round(item.discountPercentage || 0)}% ডিস্কাউন্ট
                        </span>
                      )}
                      {item.isFeatured && !hasDiscount && (
                        <span className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-semibold text-gray-900">
                          Featured
                        </span>
                      )}
                      {item.requiresPrescription && (
                        <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                          Rx
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      {item.name}
                    </h3>
                    {item.genericName && (
                      <p className="mt-1 text-sm text-gray-600">
                        {item.genericName}
                      </p>
                    )}
                    {item.strength && (
                      <p className="mt-1 text-xs text-gray-500">{item.strength}</p>
                    )}
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
                    {category.isMedicineCategory ? (
                      <AddToCartButton
                        medicineId={item.id}
                        name={item.name}
                        price={discountedPrice}
                        image={item.imageUrl || undefined}
                        requiresPrescription={item.requiresPrescription}
                        stockQuantity={item.stockQuantity}
                        className="w-full"
                      />
                    ) : (
                      <AddToCartButton
                        productId={item.id}
                        name={item.name}
                        price={discountedPrice}
                        image={item.imageUrl || undefined}
                        stockQuantity={item.stockQuantity}
                        className="w-full"
                      />
                    )}
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
