import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS, sendEmail } from '@/lib/notifications'
import { canTransitionPaymentStatus, PaymentStatus } from '@/lib/order-payment-status'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  paymentStatus: z.enum([
    PaymentStatus.PAID,
    PaymentStatus.AWAITING_PAYMENT,
    PaymentStatus.PENDING_COD,
  ]),
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
    const body = patchSchema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const nextStatus = body.data.paymentStatus

    let transitionResult
    try {
      transitionResult = await prisma.$transaction(async (tx) => {
        const before = await tx.order.findUnique({
          where: { id },
          include: {
            user: { select: { name: true, phone: true } },
            address: { include: { zone: true } },
          },
        })

        if (!before) throw new Error('ORDER_NOT_FOUND')
        if (!canTransitionPaymentStatus(before.paymentMethod, before.paymentStatus, nextStatus)) {
          throw new Error('INVALID_PAYMENT_TRANSITION')
        }

        if (before.paymentStatus === nextStatus) {
          return { before, order: before, transitioned: false }
        }

        const transition = await tx.order.updateMany({
          where: { id, paymentStatus: before.paymentStatus },
          data: { paymentStatus: nextStatus },
        })
        if (transition.count !== 1) throw new Error('ORDER_PAYMENT_CHANGED')

        const order = await tx.order.findUniqueOrThrow({ where: { id } })
        return { before, order, transitioned: true }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'ORDER_NOT_FOUND') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      if (message === 'INVALID_PAYMENT_TRANSITION') {
        return NextResponse.json({ error: 'This payment status transition is not allowed' }, { status: 409 })
      }
      if (message === 'ORDER_PAYMENT_CHANGED') {
        return NextResponse.json(
          { error: 'Payment status changed concurrently. Refresh and try again.' },
          { status: 409 }
        )
      }
      throw error
    }

    const { before, order, transitioned } = transitionResult
    const wasAwaitingOnline =
      transitioned &&
      before.paymentMethod === 'ONLINE' &&
      before.paymentStatus === PaymentStatus.AWAITING_PAYMENT

    const nowPaidOnline =
      order.paymentMethod === 'ONLINE' &&
      order.paymentStatus === PaymentStatus.PAID

    if (wasAwaitingOnline && nowPaidOnline) {
      const days =
        before.address?.zone?.deliveryDays || '৩–৫ দিনের মধ্যে'

      await Promise.all([
        sendSMS(before.user.phone, 'ORDER_CONFIRMED', {
          name: before.user.name,
          orderNumber: order.orderNumber,
          total: order.total,
          days,
        }),
        sendEmail(
          `${before.user.phone}@example.com`,
          'ORDER_CONFIRMED',
          {
            name: before.user.name,
            orderNumber: order.orderNumber,
            total: order.total,
            days,
          }
        ),
      ])

      try {
        const { forwardOrderToAzanById } =
          await import('@/lib/integrations/forward-order-to-azan')
        const r = await forwardOrderToAzanById(order.id)
        if (r.error) {
          console.error(
            `[Azan order forward after payment] ${order.orderNumber}:`,
            r.error
          )
        }
      } catch (e) {
        console.error('[Azan order forward after payment] unhandled', e)
      }
    }

    return NextResponse.json({ order })
  } catch (e) {
    console.error('PATCH /api/admin/orders/[id]/payment', e)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
