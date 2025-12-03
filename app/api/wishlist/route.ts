import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const items = wishlistItems.map((item) => ({
      id: item.id,
      productId: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.sellingPrice,
      mrp: item.product.mrp,
      imageUrl: item.product.imageUrl,
      stockQuantity: item.product.stockQuantity,
      discountPercentage: item.product.discountPercentage,
      category: item.product.category,
      type: item.product.type,
      createdAt: item.createdAt,
    }))

    const productIds = items.map((item) => item.productId)

    return NextResponse.json({ items, productIds })
  } catch (error) {
    console.error('Fetch wishlist error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}
