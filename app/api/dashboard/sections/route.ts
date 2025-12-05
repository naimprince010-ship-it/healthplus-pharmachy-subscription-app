import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/sections
 * Public endpoint to fetch dashboard product sections
 * Returns active HomeSections with their products
 * Only returns sections where displayLocations includes 'dashboard'
 */
export async function GET() {
  try {
    const allSections = await prisma.homeSection.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    // Filter sections that should appear on dashboard
    const sections = allSections.filter((section) => {
      const locations = section.displayLocations as string[] | null
      // Default to ['home'] for backward compatibility
      const displayLocations = locations || ['home']
      return displayLocations.includes('dashboard')
    })

    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        let products: any[] = []

        if (section.filterType === 'category' && section.categoryId) {
          products = await prisma.product.findMany({
            where: {
              categoryId: section.categoryId,
              isActive: true,
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              sellingPrice: true,
              mrp: true,
              discountPercentage: true,
            },
            take: section.maxProducts,
            orderBy: { createdAt: 'desc' },
          })
        } else if (section.filterType === 'brand' && section.brandName) {
          products = await prisma.product.findMany({
            where: {
              brandName: section.brandName,
              isActive: true,
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              sellingPrice: true,
              mrp: true,
              discountPercentage: true,
            },
            take: section.maxProducts,
            orderBy: { createdAt: 'desc' },
          })
        } else if (section.filterType === 'manual' && section.productIds) {
          const productIds = section.productIds as string[]
          if (productIds.length > 0) {
            products = await prisma.product.findMany({
              where: {
                id: { in: productIds },
                isActive: true,
                deletedAt: null,
              },
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
                sellingPrice: true,
                mrp: true,
                discountPercentage: true,
              },
            })
          }
        }

        return {
          id: section.id,
          title: section.title,
          slug: section.slug,
          bgColor: section.bgColor,
          badgeText: section.badgeText,
          products,
        }
      })
    )

    return NextResponse.json({ sections: sectionsWithProducts })
  } catch (error) {
    console.error('Failed to fetch dashboard sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard sections' },
      { status: 500 }
    )
  }
}
