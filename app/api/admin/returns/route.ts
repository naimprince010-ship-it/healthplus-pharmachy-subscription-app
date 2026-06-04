import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'
import { createReturnRequestSchema, returnRequestStatusSchema } from '@/lib/validations/returns'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const q = searchParams.get('q')?.trim()
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const parsedStatus = statusParam ? returnRequestStatusSchema.safeParse(statusParam) : null

    const where: {
      status?: z.infer<typeof returnRequestStatusSchema>
      createdAt?: { gte?: Date; lte?: Date }
      OR?: Array<{
        id?: { contains: string; mode: 'insensitive' }
        order?: { orderNumber: { contains: string; mode: 'insensitive' } }
        user?: { phone: { contains: string; mode: 'insensitive' } }
      }>
    } = {}

    if (parsedStatus?.success) {
      where.status = parsedStatus.data
    }

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const returns = await prisma.returnRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        order: { select: { id: true, orderNumber: true, total: true, status: true } },
        items: {
          include: {
            orderItem: {
              select: {
                id: true,
                quantity: true,
                productName: true,
                medicine: { select: { name: true } },
                product: { select: { name: true } },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    return NextResponse.json({ returns })
  } catch (error) {
    console.error('Fetch returns error:', error)
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()
    const input = createReturnRequestSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const orderItemMap = new Map(order.items.map((item) => [item.id, item]))

    for (const item of input.items) {
      const orderItem = orderItemMap.get(item.orderItemId)
      if (!orderItem) {
        return NextResponse.json({ error: `Invalid order item: ${item.orderItemId}` }, { status: 400 })
      }
      if (item.quantity > orderItem.quantity) {
        return NextResponse.json(
          { error: `Return quantity exceeds purchased quantity for item: ${item.orderItemId}` },
          { status: 400 }
        )
      }
    }

    const created = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        reason: input.reason,
        customerNote: input.customerNote,
        evidenceUrls: input.evidenceUrls,
        items: {
          create: input.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            note: item.note,
          })),
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'REQUESTED',
            note: 'Return request created',
            changedByUserId: authResult.session?.user.id,
          },
        },
      },
      include: {
        items: true,
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ returnRequest: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Create return request error:', error)
    return NextResponse.json({ error: 'Failed to create return request' }, { status: 500 })
  }
}
