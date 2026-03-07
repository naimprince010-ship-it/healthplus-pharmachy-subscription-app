import { prisma } from '@/lib/prisma'
import { Product, Medicine } from '@prisma/client'

export interface PriceComparisonResult {
    productId: string
    productName: string
    localPrice: number
    competitorAvgPrice: number
    competitorMinPrice: number
    gapPercentage: number
    status: 'CHEAPER' | 'EXPENSIVE' | 'COMPETITIVE'
    matches: Array<{
        siteName: string
        productName: string
        price: number
        url: string | null
    }>
}

/**
 * Basic Levenshtein Distance for fuzzy name matching
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []
    for (let i = 0; i <= a.length; i++) matrix[i] = [i]
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            )
        }
    }
    return matrix[a.length][b.length]
}

/**
 * Normalizes product name for better matching (lowercase, remove common suffixes)
 */
function normalizeName(name: string): string {
    return name.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\d+\s*(mg|ml|gm|kg|pcs|pack|tablet|capsule)/g, '') // Remove strength/pack size for base name match
        .trim()
}

/**
 * Finds competitor matches for a local product
 */
export async function findCompetitorMatches(product: Product & { medicine?: Medicine | null }) {
    const localName = normalizeName(product.name)
    const genericName = product.medicine?.genericName?.toLowerCase()

    // Find competitor products from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const competitors = await prisma.competitorProduct.findMany({
        where: {
            collectedAt: { gte: sevenDaysAgo },
        }
    })

    // Filter with fuzzy match or generic match
    return competitors.filter(cp => {
        const cpNameNormalized = normalizeName(cp.productName)

        // 1. Exact or near-exact name match
        if (cpNameNormalized.includes(localName) || localName.includes(cpNameNormalized)) return true

        // 2. Levenshtein check (max distance 3 or 20% of length)
        const distance = levenshteinDistance(localName, cpNameNormalized)
        if (distance <= Math.max(3, Math.floor(localName.length * 0.2))) return true

        // 3. Generic name match (if it's a medicine)
        if (genericName && cp.productName.toLowerCase().includes(genericName)) return true

        return false
    })
}

/**
 * Calculates price gap and status
 */
export function analyzePriceComparison(localPrice: number, matches: any[]): PriceComparisonResult | null {
    if (matches.length === 0) return null

    const prices = matches.map(m => m.price)
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    const minPrice = Math.min(...prices)

    const gapPercentage = ((localPrice - avgPrice) / avgPrice) * 100

    let status: 'CHEAPER' | 'EXPENSIVE' | 'COMPETITIVE' = 'COMPETITIVE'
    if (gapPercentage > 5) status = 'EXPENSIVE'
    else if (gapPercentage < -5) status = 'CHEAPER'

    return {
        productId: '', // To be filled by caller
        productName: '', // To be filled by caller
        localPrice,
        competitorAvgPrice: avgPrice,
        competitorMinPrice: minPrice,
        gapPercentage,
        status,
        matches: matches.map(m => ({
            siteName: m.siteName,
            productName: m.productName,
            price: m.price,
            url: m.productUrl
        }))
    }
}
