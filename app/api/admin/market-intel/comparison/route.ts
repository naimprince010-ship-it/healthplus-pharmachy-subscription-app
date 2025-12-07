import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const days = parseInt(searchParams.get('days') || '30', 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const whereClause = {
      collectedAt: { gte: startDate },
      ...(category ? { category } : {}),
    }

    const products = await prisma.competitorProduct.findMany({
      where: whereClause,
      orderBy: { collectedAt: 'asc' },
      select: {
        siteName: true,
        category: true,
        productName: true,
        price: true,
        collectedAt: true,
      },
    })

    const priceHistory: Record<string, Record<string, { date: string; price: number }[]>> = {}

    for (const product of products) {
      const key = `${product.siteName}-${product.category}`
      if (!priceHistory[key]) {
        priceHistory[key] = {}
      }
      
      const dateKey = product.collectedAt.toISOString().split('T')[0]
      if (!priceHistory[key][dateKey]) {
        priceHistory[key][dateKey] = []
      }
      
      priceHistory[key][dateKey].push({
        date: dateKey,
        price: product.price,
      })
    }

    const avgPricesBySiteCategory: Record<string, { date: string; avgPrice: number }[]> = {}
    
    for (const [key, dates] of Object.entries(priceHistory)) {
      avgPricesBySiteCategory[key] = Object.entries(dates).map(([date, prices]) => ({
        date,
        avgPrice: prices.reduce((sum, p) => sum + p.price, 0) / prices.length,
      })).sort((a, b) => a.date.localeCompare(b.date))
    }

    const currentPrices = await prisma.competitorProduct.groupBy({
      by: ['siteName', 'category'],
      where: whereClause,
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: { _all: true },
    })

    return NextResponse.json({
      priceHistory: avgPricesBySiteCategory,
      currentPrices: currentPrices.map(p => ({
        siteName: p.siteName,
        category: p.category,
        avgPrice: p._avg.price,
        minPrice: p._min.price,
        maxPrice: p._max.price,
        productCount: p._count._all,
      })),
    })
  } catch (error) {
    console.error('Error fetching price comparison:', error)
    return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 })
  }
}
