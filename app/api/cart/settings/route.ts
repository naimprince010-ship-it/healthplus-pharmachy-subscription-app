import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.cartPageSettings.findFirst()

    if (!settings) {
      settings = await prisma.cartPageSettings.create({
        data: {},
      })
    }

    const suggestions = await prisma.cartSuggestion.findMany({
      where: { isActive: true },
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

    return NextResponse.json({
      settings,
      suggestions: suggestions.map((s) => ({
        id: s.product.id,
        name: s.product.name,
        slug: s.product.slug,
        imageUrl: s.product.imageUrl,
        price: s.product.sellingPrice,
        mrp: s.product.mrp,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch cart page config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart page config' },
      { status: 500 }
    )
  }
}
