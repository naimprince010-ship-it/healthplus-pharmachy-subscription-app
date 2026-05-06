import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') || '4'), 10)

  try {
    // Best sellers = products with most order items, active stock, with images
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { gt: 0 },
        imageUrl: { not: null },
      },
      orderBy: [
        { discountPercentage: 'desc' }, // high discount = popular
        { stockQuantity: 'desc' },
      ],
      take: limit * 3, // fetch extra so we can filter
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        sellingPrice: true,
        mrp: true,
        discountPercentage: true,
        stockQuantity: true,
        type: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    // Pick diverse products (not all same category)
    const seen = new Set<string>()
    const filtered = products
      .filter(p => p.category)
      .filter(p => {
        if (seen.has(p.category!.slug)) return false
        seen.add(p.category!.slug)
        return true
      })
      .slice(0, limit)
      .map(p => ({
        ...p,
        sellingPrice: Number(p.sellingPrice),
        mrp: p.mrp ? Number(p.mrp) : null,
        discountPercentage: p.discountPercentage ? Number(p.discountPercentage) : null,
        stockQuantity: Number(p.stockQuantity),
      }))

    return NextResponse.json({ products: filtered })
  } catch (error) {
    console.error('Best sellers error:', error)
    return NextResponse.json({ products: [] })
  }
}
