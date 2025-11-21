import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [orders, subscriptions, memberships] = await Promise.all([
      prisma.order.findMany({
        select: {
          total: true,
        },
      }),
      prisma.subscription.count({
        where: {
          isActive: true,
        },
      }),
      prisma.userMembership.count({
        where: {
          isActive: true,
          endDate: { gte: new Date() },
        },
      }),
    ])

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

    return NextResponse.json({
      totalOrders: orders.length,
      totalRevenue,
      activeSubscriptions: subscriptions,
      activeMemberships: memberships,
    })
  } catch (error) {
    console.error('Fetch sales data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    )
  }
}
