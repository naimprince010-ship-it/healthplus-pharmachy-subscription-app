import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateRiderSchema = z.object({
  riderName: z.string().nullable().optional(),
  riderPhone: z.string().nullable().optional(),
  estimatedDeliveryText: z.string().nullable().optional(),
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
    const validatedData = updateRiderSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        riderName: validatedData.riderName,
        riderPhone: validatedData.riderPhone,
        estimatedDeliveryText: validatedData.estimatedDeliveryText,
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
            product: {
              select: { name: true, imageUrl: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: error.issues },
            { status: 400 }
          )
        }
    console.error('Update rider info error:', error)
    return NextResponse.json(
      { error: 'Failed to update rider info' },
      { status: 500 }
    )
  }
}
