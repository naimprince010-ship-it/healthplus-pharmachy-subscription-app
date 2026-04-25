import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncAzanStatusForOrder } from '@/lib/integrations/azan-order-status'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as { orderId?: string; limit?: number }
    const limit = Math.min(Math.max(Number(body.limit || 20), 1), 100)

    const orderIds = body.orderId
      ? [body.orderId]
      : (
          await prisma.order.findMany({
            where: { azanPushedAt: { not: null } },
            select: { id: true },
            orderBy: { updatedAt: 'desc' },
            take: limit,
          })
        ).map((o) => o.id)

    const results = []
    for (const id of orderIds) {
      const result = await syncAzanStatusForOrder(id)
      results.push({ orderId: id, ...result })
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      synced: results.filter((r) => r.ok && !('skipped' in r)).length,
      skipped: results.filter((r) => 'skipped' in r).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    })
  } catch (error) {
    console.error('Azan order sync error:', error)
    return NextResponse.json({ error: 'Failed to sync Azan order statuses' }, { status: 500 })
  }
}
