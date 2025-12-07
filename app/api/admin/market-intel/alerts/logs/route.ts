import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const logs = await prisma.priceAlertLog.findMany({
      where: unreadOnly ? { isRead: false } : undefined,
      orderBy: { triggeredAt: 'desc' },
      take: 100,
      include: {
        alert: true,
      },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching alert logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { ids, markAsRead } = body

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs array required' }, { status: 400 })
    }

    await prisma.priceAlertLog.updateMany({
      where: { id: { in: ids } },
      data: { isRead: markAsRead ?? true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating alert logs:', error)
    return NextResponse.json({ error: 'Failed to update logs' }, { status: 500 })
  }
}
