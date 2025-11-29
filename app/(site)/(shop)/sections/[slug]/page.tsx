import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { buildProductWhereClause } from '@/lib/homeSections'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

async function getSectionWithProducts(slug: string, page: number = 1) {
  const section = await prisma.homeSection.findFirst({
    where: { slug, isActive: true },
  })

  if (!section) {
    return null
  }

  const pageSize = 24
  const skip = (page - 1) * pageSize

  const whereClause = buildProductWhereClause(section)
  
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      skip,
      take: pageSize,
    }),
    prisma.product.count({
      where: whereClause,
    }),
  ])

  return {
    section,
    products,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  }
}

export default async function SectionDetailsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam, 10) : 1

  const data = await getSectionWithProducts(slug, page)

  if (!data) {
    notFound()
  }

  const { section, products, totalCount, totalPages, currentPage } = data

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* No container mx-auto here - ShopLayout already handles centering and max-width */}
      <div className="px-2 sm:px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {section.title}
            {section.badgeText && (
              <span className="ml-3 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                {section.badgeText}
              </span>
            )}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {totalCount} {totalCount === 1 ? 'product' : 'products'} found
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center">
            <p className="text-gray-500">No products found in this section.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => {
                const hasDiscount = product.discountPercentage && product.discountPercentage > 0
                const discountedPrice = hasDiscount 
                  ? product.sellingPrice * (1 - (product.discountPercentage || 0) / 100)
                  : product.sellingPrice
                
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-lg"
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
                      {hasDiscount && (
                        <span className="absolute left-2 top-2 z-10 rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                          {Math.round(product.discountPercentage || 0)}% ডিস্কাউন্ট
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-1 flex-col">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                      {product.brandName && (
                        <p className="mt-1 text-sm text-gray-500">{product.brandName}</p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">৳{discountedPrice.toFixed(2)}</span>
                        {hasDiscount && (
                          <span className="text-sm text-gray-500 line-through">৳{product.sellingPrice.toFixed(2)}</span>
                        )}
                        {!hasDiscount && product.mrp && product.mrp > product.sellingPrice && (
                          <span className="text-sm text-gray-500 line-through">৳{product.mrp}</span>
                        )}
                      </div>
                      <div className="mt-auto pt-4">
                        <span className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">
                          View Product
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {currentPage > 1 && (
                  <a
                    href={`/sections/${slug}?page=${currentPage - 1}`}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Previous
                  </a>
                )}
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <a
                    key={pageNum}
                    href={`/sections/${slug}?page=${pageNum}`}
                    className={`rounded-lg border px-4 py-2 transition-colors ${
                      pageNum === currentPage
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </a>
                ))}

                {currentPage < totalPages && (
                  <a
                    href={`/sections/${slug}?page=${currentPage + 1}`}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Next
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
