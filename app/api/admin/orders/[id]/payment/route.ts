import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS, sendEmail } from '@/lib/notifications'
import { PaymentStatus } from '@/lib/order-payment-status'

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

    const before = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, phone: true } },
        address: { include: { zone: true } },
      },
    })

    if (!before) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const wasAwaitingOnline =
      before.paymentMethod === 'ONLINE' &&
      before.paymentStatus === PaymentStatus.AWAITING_PAYMENT

    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus: nextStatus },
    })

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
