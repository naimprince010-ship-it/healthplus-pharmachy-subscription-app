import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const hasAiTags = searchParams.get('hasAiTags')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: {
      name?: { contains: string; mode: 'insensitive' }
      categoryId?: string
      aiTags?: { isEmpty: boolean }
    } = {}

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    if (categoryId) {
      where.categoryId = categoryId
    }
    if (hasAiTags === 'true') {
      where.aiTags = { isEmpty: false }
    } else if (hasAiTags === 'false') {
      where.aiTags = { isEmpty: true }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          category: { select: { name: true } },
          aiTags: true,
          isIngredient: true,
          ingredientType: true,
          budgetLevel: true,
          sellingPrice: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching products for tagging:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
