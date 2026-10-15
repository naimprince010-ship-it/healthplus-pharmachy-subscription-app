import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { restoreOrderInventory } from '@/lib/order-inventory'
import { canTransitionOrderStatus } from '@/lib/order-status-transition'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
})

const orderInclude = {
  user: {
    select: { name: true, phone: true, email: true },
  },
  address: {
    include: { zone: true },
  },
  items: {
    include: {
      medicine: {
        select: { name: true, imageUrl: true },
      },
      product: {
        select: { name: true, imageUrl: true },
      },
    },
  },
} as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const validationResult = updateStatusSchema.safeParse(await request.json())

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid status', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { status } = validationResult.data

    try {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({
          where: { id },
          select: {
            status: true,
            items: {
              select: {
                medicineId: true,
                productId: true,
                quantity: true,
              },
            },
          },
        })

        if (!current) throw new Error('ORDER_NOT_FOUND')

        if (!canTransitionOrderStatus(current.status, status)) {
          throw new Error('INVALID_STATUS_TRANSITION')
        }

        if (current.status !== status) {
          const transition = await tx.order.updateMany({
            where: { id, status: current.status },
            data: { status, updatedAt: new Date() },
          })
          if (transition.count !== 1) throw new Error('ORDER_CHANGED')

          if (status === 'CANCELLED') {
            await restoreOrderInventory(tx, current.items)
          }

          await tx.orderStatusHistory.create({
            data: { orderId: id, status },
          })
        }

        return tx.order.findUniqueOrThrow({
          where: { id },
          include: orderInclude,
        })
      })

      return NextResponse.json({ order: updatedOrder })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'ORDER_NOT_FOUND') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      if (message === 'INVALID_STATUS_TRANSITION') {
        return NextResponse.json(
          { error: 'This order status transition is not allowed' },
          { status: 409 }
        )
      }
      if (message === 'ORDER_CHANGED') {
        return NextResponse.json(
          { error: 'Order changed concurrently. Refresh and try again.' },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
