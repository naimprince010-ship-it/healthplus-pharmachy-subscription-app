import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/categories
 * Public endpoint to list categories (no authentication required)
 * Only returns active categories
 */
export async function GET(request: NextRequest) {
  try {
    const raw = await prisma.category.findMany({
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
        isMedicineCategory: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    const categories = raw.filter((c) => {
      if (!isMedicineShopEnabled() && c.isMedicineCategory) return false
      if (!isGroceryShopEnabled() && c.slug === GROCERY_CATEGORY_SLUG) return false
      return true
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
