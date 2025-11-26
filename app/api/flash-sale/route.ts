import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    const products = await prisma.product.findMany({
      where: {
        isFlashSale: true,
        isActive: true,
        deletedAt: null,
        flashSaleStart: {
          lte: now,
        },
        flashSaleEnd: {
          gte: now,
        },
        flashSalePrice: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        sellingPrice: true,
        flashSalePrice: true,
        flashSaleEnd: true,
        stockQuantity: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        sellingPrice: 'desc', // Will be sorted by discount % in the response
      },
    })

    const productsWithDiscount = products
      .map((product) => {
        const discountAmount = product.sellingPrice - (product.flashSalePrice || 0)
        const discountPercentage = Math.round((discountAmount / product.sellingPrice) * 100)
        
        return {
          ...product,
          discountAmount,
          discountPercentage,
        }
      })
      .sort((a, b) => b.discountPercentage - a.discountPercentage)

    return NextResponse.json({
      products: productsWithDiscount,
      count: productsWithDiscount.length,
    })
  } catch (error) {
    console.error('Error fetching flash sale products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flash sale products' },
      { status: 500 }
    )
  }
}
