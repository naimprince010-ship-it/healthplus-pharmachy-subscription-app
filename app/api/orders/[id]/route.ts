import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncAzanStatusForOrder } from '@/lib/integrations/azan-order-status'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
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
              select: { id: true, name: true, imageUrl: true, unit: true },
            },
            product: {
              select: { id: true, name: true, imageUrl: true, unit: true },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify the order belongs to the current user (unless admin)
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const statusSyncConfigured = Boolean(process.env.AZAN_WHOLESALE_ORDER_STATUS_PATH)
    const canSyncAzan = Boolean(order.azanPushedAt) && statusSyncConfigured
    const staleMs = order.azanStatusSyncedAt ? Date.now() - order.azanStatusSyncedAt.getTime() : Number.POSITIVE_INFINITY
    if (canSyncAzan && staleMs > 5 * 60 * 1000) {
      await syncAzanStatusForOrder(order.id).catch((err) => {
        console.error('Azan status lazy sync failed:', err)
      })
      const refreshed = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, phone: true, email: true } },
          address: { include: { zone: true } },
          items: {
            include: {
              medicine: { select: { id: true, name: true, imageUrl: true, unit: true } },
              product: { select: { id: true, name: true, imageUrl: true, unit: true } },
            },
          },
          statusHistory: { orderBy: { changedAt: 'asc' } },
        },
      })
      return NextResponse.json({ order: refreshed })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Fetch order error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
