import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEngineCartSuggestions } from '@/lib/cart-suggestions-engine'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.cartPageSettings.findFirst()

    if (!settings) {
      settings = await prisma.cartPageSettings.create({
        data: {},
      })
    }

    const cartParam = request.nextUrl.searchParams.get('cart') || ''
    const cartLineIds = cartParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const manual = await prisma.cartSuggestion.findMany({
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

    const mapProduct = (row: {
      id: string
      name: string
      slug: string
      imageUrl: string | null
      sellingPrice: number
      mrp: number | null
    }) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.imageUrl,
      price: row.sellingPrice,
      mrp: row.mrp,
    })

    if (manual.length > 0) {
      return NextResponse.json({
        settings,
        suggestions: manual.map((s) => mapProduct(s.product)),
        source: 'manual' as const,
      })
    }

    const engine = await getEngineCartSuggestions({
      cartLineIds,
      limit: 12,
    })

    return NextResponse.json({
      settings,
      suggestions: engine.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: p.imageUrl,
        price: p.price,
        mrp: p.mrp,
      })),
      source: 'engine' as const,
    })
  } catch (error) {
    console.error('Failed to fetch cart page config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart page config' },
      { status: 500 }
    )
  }
}
