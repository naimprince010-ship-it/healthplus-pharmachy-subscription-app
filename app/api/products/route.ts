import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const productListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['MEDICINE', 'GENERAL', 'all']).default('all'),
  sortBy: z.enum(['createdAt', 'name', 'sellingPrice', 'stockQuantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/products
 * Public endpoint to list products (no authentication required)
 * Returns unified catalog: Product records + Medicine records (where productId is null)
 * Only returns active, non-deleted items
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryResult = productListQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      type: searchParams.get('type') || 'all',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      )
    }

    const query = queryResult.data
    const skip = (query.page - 1) * query.limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productWhere: any = {
      deletedAt: null,
      isActive: true,
    }

    if (query.type === 'MEDICINE') {
      productWhere.type = 'MEDICINE'
    } else if (query.type === 'GENERAL') {
      productWhere.type = 'GENERAL'
    }

    if (query.search) {
      productWhere.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { brandName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.categoryId) {
      productWhere.categoryId = query.categoryId
    }

    const [productCount, productRecords] = await Promise.all([
      prisma.product.count({ where: productWhere }),
      prisma.product.findMany({
        where: productWhere,
        select: {
          id: true,
          type: true,
          name: true,
          slug: true,
          brandName: true,
          description: true,
          sellingPrice: true,
          mrp: true,
          stockQuantity: true,
          imageUrl: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        take: query.limit * 2, // Fetch more to account for merging
      }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let medicineRecords: any[] = []
    let medicineCount = 0

    if (query.type === 'all' || query.type === 'MEDICINE') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const medicineWhere: any = {
        deletedAt: null,
        isActive: true,
        productId: null,
      }

      if (query.search) {
        medicineWhere.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { genericName: { contains: query.search, mode: 'insensitive' } },
          { brandName: { contains: query.search, mode: 'insensitive' } },
        ]
      }

      if (query.categoryId) {
        medicineWhere.categoryId = query.categoryId
      }

      const [mCount, mRecords] = await Promise.all([
        prisma.medicine.count({ where: medicineWhere }),
        prisma.medicine.findMany({
          where: medicineWhere,
          select: {
            id: true,
            name: true,
            slug: true,
            brandName: true,
            genericName: true,
            description: true,
            sellingPrice: true,
            mrp: true,
            stockQuantity: true,
            imageUrl: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { [query.sortBy]: query.sortOrder },
          take: query.limit * 2,
        }),
      ])

      medicineCount = mCount
      medicineRecords = mRecords.map((m) => ({
        id: m.id,
        type: 'MEDICINE' as const,
        name: m.name,
        slug: m.slug,
        brandName: m.brandName,
        description: m.description || (m.genericName ? `Generic: ${m.genericName}` : null),
        sellingPrice: m.sellingPrice,
        mrp: m.mrp,
        stockQuantity: m.stockQuantity,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
        category: m.category,
        _source: 'medicine' as const, // Internal flag to help with routing
      }))
    }

    const allItems = [...productRecords, ...medicineRecords]
    
    allItems.sort((a, b) => {
      const aVal = a[query.sortBy as keyof typeof a]
      const bVal = b[query.sortBy as keyof typeof b]
      
      if (query.sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

    const paginatedItems = allItems.slice(skip, skip + query.limit)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = paginatedItems.map(({ _source, ...item }: any) => ({
      ...item,
      href: _source === 'medicine' ? `/medicines/${item.slug}` : `/products/${item.slug}`,
      cartInfo: _source === 'medicine' 
        ? { kind: 'medicine' as const, medicineId: item.id }
        : { kind: 'product' as const, productId: item.id },
    }))

    const total = productCount + medicineCount

    return NextResponse.json({
      products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('Fetch products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
