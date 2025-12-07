import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get trending products (top 50 by trend score in last 7 days)
    const trending = await prisma.competitorProduct.findMany({
      where: {
        collectedAt: { gte: sevenDaysAgo },
      },
      orderBy: { trendScore: 'desc' },
      take: 50,
    })

    // Get heat map data (average trend score by category and site)
    const heatMapRaw = await prisma.competitorProduct.groupBy({
      by: ['category', 'siteName'],
      where: {
        collectedAt: { gte: sevenDaysAgo },
      },
      _avg: { trendScore: true },
      _count: { _all: true },
    })

    const heatMap = heatMapRaw.map(item => ({
      category: item.category,
      siteName: item.siteName,
      avgTrendScore: item._avg.trendScore || 0,
      count: item._count._all,
    }))

    // Get last sync time
    const lastSyncRecord = await prisma.competitorProduct.findFirst({
      orderBy: { collectedAt: 'desc' },
      select: { collectedAt: true },
    })

    return NextResponse.json({
      trending,
      heatMap,
      lastSync: lastSyncRecord?.collectedAt || null,
    })
  } catch (error) {
    console.error('Market intel fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market intelligence data' },
      { status: 500 }
    )
  }
}
