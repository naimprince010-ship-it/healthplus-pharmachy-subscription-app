import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const gaps = await prisma.productGap.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ gapScore: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    })

    return NextResponse.json({ gaps })
  } catch (error) {
    console.error('Error fetching gaps:', error)
    return NextResponse.json({ error: 'Failed to fetch gaps' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const competitorProducts = await prisma.competitorProduct.findMany({
      where: { collectedAt: { gte: sevenDaysAgo } },
      orderBy: { trendScore: 'desc' },
    })

    const ourProducts = await prisma.product.findMany({
      select: { name: true, slug: true, id: true },
    })
    const ourProductNames = new Set(ourProducts.map(p => p.name.toLowerCase()))

    const existingGaps = await prisma.productGap.findMany({
      where: { status: 'open' },
      select: { competitorProduct: true },
    })
    const existingGapNames = new Set(existingGaps.map(g => g.competitorProduct.toLowerCase()))

    const newGaps = []

    for (const product of competitorProducts) {
      const productNameLower = product.productName.toLowerCase()
      
      if (existingGapNames.has(productNameLower)) continue

      const hasMatch = Array.from(ourProductNames).some(ourName => {
        const similarity = calculateSimilarity(productNameLower, ourName)
        return similarity > 0.7
      })

      if (hasMatch) continue

      const gapScore = product.trendScore + (product.reviewCount * 0.5)

      if (gapScore < 10) continue

      newGaps.push({
        competitorProduct: product.productName,
        category: product.category,
        siteName: product.siteName,
        competitorPrice: product.price,
        reviewCount: product.reviewCount,
        gapScore,
      })

      existingGapNames.add(productNameLower)
    }

    if (newGaps.length > 0) {
      await prisma.productGap.createMany({
        data: newGaps.slice(0, 50),
      })
    }

    return NextResponse.json({
      analyzed: competitorProducts.length,
      gapsFound: Math.min(newGaps.length, 50),
      gaps: newGaps.slice(0, 50),
    })
  } catch (error) {
    console.error('Error analyzing gaps:', error)
    return NextResponse.json({ error: 'Failed to analyze gaps' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, matchedProductId } = body

    if (!id) {
      return NextResponse.json({ error: 'Gap ID required' }, { status: 400 })
    }

    const gap = await prisma.productGap.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(matchedProductId !== undefined ? { matchedProductId } : {}),
      },
    })

    return NextResponse.json({ gap })
  } catch (error) {
    console.error('Error updating gap:', error)
    return NextResponse.json({ error: 'Failed to update gap' }, { status: 500 })
  }
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/).filter(w => w.length > 2)
  const words2 = str2.split(/\s+/).filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  let matches = 0
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matches++
        break
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length)
}
