import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BulkDeleteFilters {
  search?: string
  categoryId?: string
  type?: string
  isActive?: string
}

function buildWhereFromFilters(filters: BulkDeleteFilters) {
  const where: any = {
    deletedAt: null,
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { brandName: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  if (filters.type && filters.type !== 'all') {
    where.type = filters.type
  }

  if (filters.isActive && filters.isActive !== 'all') {
    where.isActive = filters.isActive === 'true'
  }

  return where
}

/**
 * POST /api/admin/products/bulk-delete
 * Delete multiple products at once
 * Supports both:
 * - ids: string[] - delete specific products by ID
 * - selectAll: true + filters - delete all products matching filters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { ids, selectAll, filters } = body

    let where: any

    if (selectAll && filters) {
      where = buildWhereFromFilters(filters)
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      where = { id: { in: ids } }
    } else {
      return NextResponse.json(
        { error: 'No product IDs provided or selectAll with filters' },
        { status: 400 }
      )
    }

    const count = await prisma.product.count({ where })

    const result = await prisma.product.updateMany({
      where,
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      summary: {
        requested: count,
        deleted: result.count,
      },
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete products' },
      { status: 500 }
    )
  }
}
