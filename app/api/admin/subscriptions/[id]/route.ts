import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

const ALLOWED_STATUS = ['pending', 'active', 'paused', 'cancelled'] as const
const ALLOWED_PAYMENT_STATUS = ['unpaid', 'paid', 'refunded'] as const
const ALLOWED_PAYMENT_METHOD = ['cod', 'bkash', 'online'] as const

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status, paymentStatus, paymentMethod, nextDelivery } = body

    if (status && !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ALLOWED_STATUS.join(', ')}` },
        { status: 400 }
      )
    }

    if (paymentStatus && !ALLOWED_PAYMENT_STATUS.includes(paymentStatus)) {
      return NextResponse.json(
        { error: `Invalid payment status. Must be one of: ${ALLOWED_PAYMENT_STATUS.join(', ')}` },
        { status: 400 }
      )
    }

    if (paymentMethod && !ALLOWED_PAYMENT_METHOD.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${ALLOWED_PAYMENT_METHOD.join(', ')}` },
        { status: 400 }
      )
    }

    if (nextDelivery) {
      const deliveryDate = new Date(nextDelivery)
      if (isNaN(deliveryDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format for nextDelivery' },
          { status: 400 }
        )
      }
    }

    const updateData: {
      status?: string
      paymentStatus?: string
      paymentMethod?: string
      nextDelivery?: Date
    } = {}

    if (status !== undefined) updateData.status = status
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (nextDelivery !== undefined) updateData.nextDelivery = new Date(nextDelivery)

    const subscription = await prisma.subscription.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        plan: true,
        zone: true,
        user: {
          select: { name: true, phone: true, email: true },
        },
      },
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context)
}
