import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
})

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
    const body = await request.json()
    const validationResult = updateStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid status', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { status } = validationResult.data

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Use transaction to update order and create status history entry
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update the order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
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
            },
          },
        },
      })

      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
        },
      })

      return updated
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
