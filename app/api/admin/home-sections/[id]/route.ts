import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateHomeSectionSchema } from '@/lib/validations/homeSection'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const section = await prisma.homeSection.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Failed to fetch home section:', error)
    return NextResponse.json(
      { error: 'Failed to fetch home section' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateHomeSectionSchema.parse({ ...body, id })

    const section = await prisma.homeSection.update({
      where: { id },
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
      },
    })

    return NextResponse.json({ section })
  } catch (error: any) {
    console.error('Failed to update home section:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update home section' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.homeSection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete home section:', error)
    return NextResponse.json(
      { error: 'Failed to delete home section' },
      { status: 500 }
    )
  }
}
