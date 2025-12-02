import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const suggestion = await prisma.cartSuggestion.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            sellingPrice: true,
            mrp: true,
          },
        },
      },
    })

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('Failed to fetch cart suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart suggestion' },
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

    const suggestion = await prisma.cartSuggestion.update({
      where: { id },
      data: {
        productId: body.productId,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            sellingPrice: true,
            mrp: true,
          },
        },
      },
    })

    return NextResponse.json({ suggestion })
  } catch (error: any) {
    console.error('Failed to update cart suggestion:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update cart suggestion' },
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

    await prisma.cartSuggestion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete cart suggestion:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete cart suggestion' },
      { status: 500 }
    )
  }
}
