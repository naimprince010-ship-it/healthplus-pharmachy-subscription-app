import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/ProductCard'
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                // Ensure product has a valid category for ProductCard
                const productWithCategory = {
                  ...product,
                  category: product.category || {
                    id: 'uncategorized',
                    name: 'Uncategorized',
                    slug: 'uncategorized'
                  }
                }
                return <ProductCard key={product.id} product={productWithCategory} />
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
