import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRecentSyncLogs } from '@/lib/market-intel/sync'

/**
 * GET /api/admin/market-intel
 * 
 * Query parameters:
 * - range: 7 | 30 | 90 (days, default: 7)
 * - category: string (optional, filter trending products by category)
 * 
 * Returns:
 * - trending: Top 50 products by trend score
 * - heatMap: Average trend score by category and site
 * - lastSync: Timestamp of last sync
 * - syncLogs: Last 5 sync logs
 */
export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const rangeParam = searchParams.get('range')
    const categoryParam = searchParams.get('category')

    // Validate range parameter (7, 30, or 90 days)
    const validRanges = [7, 30, 90]
    const range = rangeParam ? parseInt(rangeParam, 10) : 7
    const days = validRanges.includes(range) ? range : 7

    // Calculate date threshold
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    // Build where clause for trending products
    const trendingWhere: {
      collectedAt: { gte: Date }
      category?: string
    } = {
      collectedAt: { gte: dateThreshold },
    }

    // Add category filter if provided
    if (categoryParam) {
      trendingWhere.category = categoryParam
    }

    // Get trending products (top 50 by trend score)
    const trending = await prisma.competitorProduct.findMany({
      where: trendingWhere,
      orderBy: { trendScore: 'desc' },
      take: 50,
    })

    // Get heat map data (average trend score by category and site)
    // Heat map always uses the date range but not the category filter
    const heatMapRaw = await prisma.competitorProduct.groupBy({
      by: ['category', 'siteName'],
      where: {
        collectedAt: { gte: dateThreshold },
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

    // Get recent sync logs
    const syncLogs = await getRecentSyncLogs(5)

    return NextResponse.json({
      trending,
      heatMap,
      lastSync: lastSyncRecord?.collectedAt || null,
      syncLogs,
      filters: {
        range: days,
        category: categoryParam || null,
      },
    })
  } catch (error) {
    console.error('Market intel fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market intelligence data' },
      { status: 500 }
    )
  }
}
