import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const suggestions = await prisma.cartSuggestion.findMany({
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
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Failed to fetch cart suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart suggestions' },
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

    if (!body.productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const existingSuggestion = await prisma.cartSuggestion.findFirst({
      where: { productId: body.productId },
    })

    if (existingSuggestion) {
      return NextResponse.json(
        { error: 'This product is already in suggestions' },
        { status: 400 }
      )
    }

    const suggestion = await prisma.cartSuggestion.create({
      data: {
        productId: body.productId,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
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

    return NextResponse.json({ suggestion }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create cart suggestion:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create cart suggestion' },
      { status: 500 }
    )
  }
}
