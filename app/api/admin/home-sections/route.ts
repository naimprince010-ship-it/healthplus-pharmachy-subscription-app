import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createHomeSectionSchema } from '@/lib/validations/homeSection'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sections = await prisma.homeSection.findMany({
      include: {
        category: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Failed to fetch home sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch home sections' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createHomeSectionSchema.parse(body)

        const section = await prisma.homeSection.create({
          data: {
            title: validatedData.title,
            slug: validatedData.slug,
            filterType: validatedData.filterType,
            categoryId: validatedData.categoryId || null,
            brandName: validatedData.brandName || null,
            productIds: validatedData.productIds ? validatedData.productIds : undefined,
            maxProducts: validatedData.maxProducts,
            bgColor: validatedData.bgColor || null,
            badgeText: validatedData.badgeText || null,
            sortOrder: validatedData.sortOrder,
            isActive: validatedData.isActive,
            displayLocations: validatedData.displayLocations || ['home'],
          },
        })

    return NextResponse.json({ section }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create home section:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create home section' },
      { status: 500 }
    )
  }
}
