import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { forwardOrderToAzanById } from '@/lib/integrations/forward-order-to-azan'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Manually (re)send an order to Azan POST /api/orders/store.
 * If already marked pushed, forwardOrderToAzanById skips unless you clear azanPushedAt in DB.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true },
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const result = await forwardOrderToAzanById(order.id)
    const fresh = await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        orderNumber: true,
        azanPushedAt: true,
        azanPushError: true,
        azanOrderId: true,
      },
    })

    return NextResponse.json({ result, order: fresh })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Forward failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
