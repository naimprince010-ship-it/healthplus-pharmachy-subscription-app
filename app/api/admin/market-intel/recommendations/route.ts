import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const recommendations = await prisma.productRecommendation.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const topProducts = await prisma.competitorProduct.findMany({
      where: { collectedAt: { gte: sevenDaysAgo } },
      orderBy: { trendScore: 'desc' },
      take: 100,
    })

    const existingRecommendations = await prisma.productRecommendation.findMany({
      where: { status: { in: ['pending', 'approved'] } },
      select: { productName: true },
    })
    const existingNames = new Set(existingRecommendations.map(r => r.productName.toLowerCase()))

    const newRecommendations = []

    for (const product of topProducts) {
      if (existingNames.has(product.productName.toLowerCase())) continue

      let reason = ''
      let priority = 0

      if (product.trendScore > 50) {
        reason = `High trend score (${product.trendScore.toFixed(1)}) - very popular on ${product.siteName}`
        priority = 3
      } else if (product.trendScore > 20) {
        reason = `Good trend score (${product.trendScore.toFixed(1)}) - popular on ${product.siteName}`
        priority = 2
      } else if (product.reviewCount > 10) {
        reason = `High review count (${product.reviewCount}) on ${product.siteName}`
        priority = 1
      } else {
        continue
      }

      newRecommendations.push({
        productName: product.productName,
        category: product.category,
        sourceSite: product.siteName,
        reason,
        priority,
        estimatedDemand: Math.min(100, product.trendScore + 50),
        competitorPrice: product.price,
      })

      existingNames.add(product.productName.toLowerCase())
    }

    if (newRecommendations.length > 0) {
      await prisma.productRecommendation.createMany({
        data: newRecommendations,
      })
    }

    return NextResponse.json({
      generated: newRecommendations.length,
      recommendations: newRecommendations,
    })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 })
    }

    const recommendation = await prisma.productRecommendation.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ recommendation })
  } catch (error) {
    console.error('Error updating recommendation:', error)
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
  }
}
