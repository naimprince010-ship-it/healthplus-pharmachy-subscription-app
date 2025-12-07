import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const forecasts = await prisma.demandForecast.findMany({
      where: category ? { category } : undefined,
      orderBy: { forecastDate: 'desc' },
      take: 50,
    })

    return NextResponse.json({ forecasts })
  } catch (error) {
    console.error('Error fetching forecasts:', error)
    return NextResponse.json({ error: 'Failed to fetch forecasts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const recentData = await prisma.competitorProduct.groupBy({
      by: ['category', 'siteName'],
      where: { collectedAt: { gte: sevenDaysAgo } },
      _avg: { trendScore: true, reviewCount: true, price: true },
      _count: { _all: true },
    })

    const olderData = await prisma.competitorProduct.groupBy({
      by: ['category', 'siteName'],
      where: {
        collectedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      _avg: { trendScore: true, reviewCount: true },
    })

    const forecasts = []
    const forecastDate = new Date()
    forecastDate.setDate(forecastDate.getDate() + 7)

    for (const recent of recentData) {
      const older = olderData.find(
        o => o.category === recent.category && o.siteName === recent.siteName
      )

      const recentTrend = recent._avg.trendScore || 0
      const olderTrend = older?._avg.trendScore || recentTrend
      const trendChange = recentTrend - olderTrend

      const recentReviews = recent._avg.reviewCount || 0
      const olderReviews = older?._avg.reviewCount || recentReviews
      const reviewGrowth = olderReviews > 0 ? (recentReviews - olderReviews) / olderReviews : 0

      let predictedDemand = 50
      predictedDemand += trendChange * 2
      predictedDemand += reviewGrowth * 30
      predictedDemand = Math.max(0, Math.min(100, predictedDemand))

      const confidence = Math.min(1, (recent._count._all / 20) * 0.5 + (older ? 0.5 : 0.2))

      const factors = {
        trendChange: trendChange.toFixed(2),
        reviewGrowth: (reviewGrowth * 100).toFixed(1) + '%',
        productCount: recent._count._all,
        avgPrice: recent._avg.price?.toFixed(2),
      }

      forecasts.push({
        category: recent.category,
        siteName: recent.siteName,
        forecastDate,
        predictedDemand,
        confidence,
        factors: JSON.stringify(factors),
      })
    }

    if (forecasts.length > 0) {
      await prisma.demandForecast.deleteMany({
        where: { forecastDate: { gte: new Date() } },
      })

      await prisma.demandForecast.createMany({ data: forecasts })
    }

    return NextResponse.json({
      generated: forecasts.length,
      forecasts,
    })
  } catch (error) {
    console.error('Error generating forecasts:', error)
    return NextResponse.json({ error: 'Failed to generate forecasts' }, { status: 500 })
  }
}
