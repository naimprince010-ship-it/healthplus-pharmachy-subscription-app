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
  type: z.enum(['MEDICINE', 'GENERAL', 'all']).default('GENERAL'),
  sortBy: z.enum(['createdAt', 'name', 'sellingPrice', 'stockQuantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/products
 * Public endpoint to list products (no authentication required)
 * Only returns active, non-deleted products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryResult = productListQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      type: searchParams.get('type') || 'GENERAL',
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

    const where: any = {
      deletedAt: null,
      isActive: true,
    }

    if (query.type !== 'all') {
      where.type = query.type
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { brandName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId
    }

    const total = await prisma.product.count({ where })

    const products = await prisma.product.findMany({
      where,
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    })

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
