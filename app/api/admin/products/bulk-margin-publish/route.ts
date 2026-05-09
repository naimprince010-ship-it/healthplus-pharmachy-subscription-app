import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWhereAzanCatalogProducts } from '@/lib/integrations/azan-catalog'
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

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    }

    if (applyToAzanCategory) {
      Object.assign(where, prismaWhereAzanCatalogProducts())
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
        mrp: true,
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

      let sellingPrice = Math.ceil(product.purchasePrice * marginMultiplier)
      
      // Cap the selling price at Azan's MRP if it exists, to avoid "Invalid price" error
      // But ensure we never sell below the purchase price.
      if (product.mrp && sellingPrice > product.mrp) {
        sellingPrice = Math.max(product.mrp, product.purchasePrice)
      }

      await prisma.product.update({
        where: { id: product.id },
        data: {
          sellingPrice,
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
