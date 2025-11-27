import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/ProductCard'
import { buildProductWhereClause } from '@/lib/homeSections'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

async function getSectionWithProducts(slug: string, page: number = 1) {
  try {
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
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    console.error('SECTIONS_PAGE_ERROR', err)
    throw new Error(`SECTIONS_PAGE_ERROR: ${error?.code ?? ''} ${error?.message ?? ''}`)
  }
}

export default async function SectionDetailsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam, 10) : 1

  // DEBUG Step 2: Test with Prisma query but simple rendering (no ProductCard)
  const data = await getSectionWithProducts(slug, page)

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">Section Not Found</h1>
          <p>Slug: {slug} not found or not active</p>
        </div>
      </div>
    )
  }

  const { section, products, totalCount } = data

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900">{section.title}</h1>
        <p>Slug: {slug}</p>
        <p>Total products: {totalCount}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg border p-4">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-500">Price: {product.sellingPrice}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
