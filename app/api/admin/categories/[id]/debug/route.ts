import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        isActive: true,
        parentCategoryId: true,
        sortOrder: true,
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        id: { not: id },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    })

    const categoryData = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      imageUrl: category.imageUrl ?? null,
      isActive: category.isActive,
      parentCategoryId: category.parentCategoryId ?? null,
      sortOrder: category.sortOrder ?? 0,
    }

    return NextResponse.json({
      success: true,
      rawCategory: category,
      shapedCategory: categoryData,
      parentOptions: categories,
      types: {
        description: typeof category.description,
        imageUrl: typeof category.imageUrl,
        parentCategoryId: typeof category.parentCategoryId,
        sortOrder: typeof category.sortOrder,
      },
    })
  } catch (error: any) {
    const { id } = await params
    console.error('Debug endpoint error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      categoryId: id,
    })
    
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
