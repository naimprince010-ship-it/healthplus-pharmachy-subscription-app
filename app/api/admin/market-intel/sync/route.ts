import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeAllSitesOnce, calculateTrendScore } from '@/lib/market-intel/scrapers'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const cronSecret = process.env.MARKET_INTEL_CRON_SECRET

  if (cronSecret && token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const scraped = await scrapeAllSitesOnce()

    if (!scraped.length) {
      return NextResponse.json({ inserted: 0, message: 'No products scraped' })
    }

    const now = new Date()
    const data = scraped.map(item => ({
      siteName: item.siteName,
      category: item.category,
      productName: item.productName,
      price: item.price,
      reviewCount: item.reviewCount,
      trendScore: calculateTrendScore(item.reviewCount, item.price),
      productUrl: item.productUrl,
      imageUrl: item.imageUrl,
      collectedAt: now,
    }))

    await prisma.competitorProduct.createMany({ data })

    return NextResponse.json({ 
      inserted: scraped.length,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Market intel sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
