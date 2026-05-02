import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ProductInteractionKind } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z
  .object({
    kind: z.enum(['VIEW_ITEM', 'ADD_TO_CART']),
    productId: z.string().optional(),
    medicineId: z.string().optional(),
  })
  .refine((d) => Boolean(d.productId?.trim()) || Boolean(d.medicineId?.trim()), {
    message: 'productId or medicineId required',
  })

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { kind, productId: rawProductId, medicineId } = parsed.data
    let resolvedProductId: string | null = rawProductId?.trim() || null

    if (!resolvedProductId && medicineId?.trim()) {
      const m = await prisma.medicine.findUnique({
        where: { id: medicineId.trim() },
        select: { productId: true },
      })
      resolvedProductId = m?.productId ?? null
    }

    if (!resolvedProductId) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const product = await prisma.product.findFirst({
      where: {
        id: resolvedProductId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    const kindEnum =
      kind === 'VIEW_ITEM'
        ? ProductInteractionKind.VIEW_ITEM
        : ProductInteractionKind.ADD_TO_CART

    await prisma.productInteractionLog.create({
      data: {
        userId,
        productId: product.id,
        kind: kindEnum,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[product-interaction]', error)
    return NextResponse.json(
      { error: 'Failed to log interaction' },
      { status: 500 }
    )
  }
}
