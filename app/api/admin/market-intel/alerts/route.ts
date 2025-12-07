import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const alerts = await prisma.priceAlert.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        alerts: {
          orderBy: { triggeredAt: 'desc' },
          take: 5,
        },
      },
    })

    const unreadCount = await prisma.priceAlertLog.count({
      where: { isRead: false },
    })

    return NextResponse.json({ alerts, unreadCount })
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, siteName, thresholdType, thresholdValue } = body

    if (!category || !thresholdType || thresholdValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const alert = await prisma.priceAlert.create({
      data: {
        category,
        siteName: siteName || null,
        thresholdType,
        thresholdValue: parseFloat(thresholdValue),
      },
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error creating price alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    await prisma.priceAlert.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting price alert:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
