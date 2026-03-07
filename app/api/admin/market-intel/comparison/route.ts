import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findCompetitorMatches, analyzePriceComparison } from '@/lib/market-intel/comparison'

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const status = searchParams.get('status') // CHEAPER | EXPENSIVE | COMPETITIVE
        const limit = parseInt(searchParams.get('limit') || '100')

        // Fetch products with their medicine details
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                medicine: { isNot: null }
            },
            include: {
                medicine: true
            },
            take: 200 // Analyze top 200 for now to avoid timeout
        })

        const comparisons = []

        for (const product of products) {
            const matches = await findCompetitorMatches(product)
            const analysis = analyzePriceComparison(product.sellingPrice, matches)

            if (analysis) {
                analysis.productId = product.id
                analysis.productName = product.name

                if (!status || analysis.status === status) {
                    comparisons.push(analysis)
                }
            }
        }

        // Sort by gap percentage desc (most expensive first)
        comparisons.sort((a, b) => b.gapPercentage - a.gapPercentage)

        return NextResponse.json(comparisons.slice(0, limit))
    } catch (error) {
        console.error('Price comparison report error:', error)
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
    }
}
