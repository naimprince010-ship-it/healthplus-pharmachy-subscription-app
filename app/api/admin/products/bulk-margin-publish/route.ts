import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { invalidateSearchIndex } from '@/lib/search-index'

const bulkMarginSchema = z.object({
  marginPercent: z.number().min(0).max(500),
  publish: z.boolean().default(true),
  ids: z.array(z.string()).optional(),
  applyToAzanCategory: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = bulkMarginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { marginPercent, publish, ids, applyToAzanCategory } = parsed.data
    const marginMultiplier = 1 + marginPercent / 100
    const azanCategoryName = process.env.AZAN_WHOLESALE_CATEGORY || 'Azan Wholesale'

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    }

    if (applyToAzanCategory) {
      where.category = { is: { name: azanCategoryName } }
    } else if (ids && ids.length > 0) {
      where.id = { in: ids }
    } else {
      return NextResponse.json(
        { error: 'Provide product ids or enable applyToAzanCategory' },
        { status: 400 }
      )
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        purchasePrice: true,
        sellingPrice: true,
      },
    })

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        summary: { total: 0, updated: 0, skippedMissingPurchasePrice: 0 },
      })
    }

    let updated = 0
    let skippedMissingPurchasePrice = 0

    for (const product of products) {
      if (!product.purchasePrice || product.purchasePrice <= 0) {
        skippedMissingPurchasePrice++
        continue
      }

      const sellingPrice = Math.ceil(product.purchasePrice * marginMultiplier)
      await prisma.product.update({
        where: { id: product.id },
        data: {
          sellingPrice,
          mrp: sellingPrice,
          ...(publish ? { isActive: true } : {}),
        },
      })
      updated++
    }

    invalidateSearchIndex()

    return NextResponse.json({
      success: true,
      summary: {
        total: products.length,
        updated,
        skippedMissingPurchasePrice,
      },
      message: publish
        ? 'Margin applied and products published'
        : 'Margin applied on selected products',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply margin'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
