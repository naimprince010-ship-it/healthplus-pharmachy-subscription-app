import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateSearchIndex } from '@/lib/search-index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderCounts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { not: null },
      },
      _sum: {
        quantity: true,
      },
    })

    const medicineOrderCounts = await prisma.orderItem.groupBy({
      by: ['medicineId'],
      where: {
        medicineId: { not: null },
        productId: null,
      },
      _sum: {
        quantity: true,
      },
    })

    const medicineToProduct = await prisma.medicine.findMany({
      where: {
        productId: { not: null },
      },
      select: {
        id: true,
        productId: true,
      },
    })

    const medicineProductMap = new Map<string, string>()
    for (const m of medicineToProduct) {
      if (m.productId) {
        medicineProductMap.set(m.id, m.productId)
      }
    }

    const productScores = new Map<string, number>()

    for (const item of orderCounts) {
      if (item.productId) {
        const current = productScores.get(item.productId) || 0
        productScores.set(item.productId, current + (item._sum.quantity || 0))
      }
    }

    for (const item of medicineOrderCounts) {
      if (item.medicineId) {
        const productId = medicineProductMap.get(item.medicineId)
        if (productId) {
          const current = productScores.get(productId) || 0
          productScores.set(productId, current + (item._sum.quantity || 0))
        }
      }
    }

    let updatedCount = 0
    for (const [productId, score] of productScores) {
      await prisma.$executeRaw`UPDATE "Product" SET "popularityScore" = ${score} WHERE id = ${productId}`
      updatedCount++
    }

    invalidateSearchIndex()

    return NextResponse.json({
      success: true,
      message: `Updated popularity scores for ${updatedCount} products`,
      updatedCount,
    })
  } catch (error) {
    console.error('Update popularity error:', error)
    return NextResponse.json(
      { error: 'Failed to update popularity scores' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to update product popularity scores based on order counts',
    usage: 'POST /api/admin/update-popularity',
  })
}
