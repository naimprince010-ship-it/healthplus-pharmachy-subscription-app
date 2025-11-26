import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/categories
 * Public endpoint to list categories (no authentication required)
 * Only returns active categories
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        parentCategoryId: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
