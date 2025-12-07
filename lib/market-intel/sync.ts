import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { scrapeAllSitesOnce, calculateTrendScoresForBatch } from './scrapers'

export interface SyncResult {
  success: boolean
  inserted: number
  timestamp: Date
  logId: string
  error?: string
}

/**
 * Shared sync logic for Market Intelligence
 * Used by both /api/admin/market-intel/sync and /api/cron/market-intel
 * 
 * This function:
 * 1. Creates a sync log entry with status 'running'
 * 2. Scrapes all competitor sites
 * 3. Calculates trend scores using the Phase 2 batch-aware formula
 * 4. Inserts products into the database
 * 5. Updates the sync log with final status
 */
export async function runMarketIntelSync(): Promise<SyncResult> {
  // Create sync log entry
  const syncLog = await prisma.marketIntelSyncLog.create({
    data: {
      status: 'running',
      startedAt: new Date(),
    },
  })

  try {
    // Scrape all sites
    const scraped = await scrapeAllSitesOnce()

    if (!scraped.length) {
      // Update log with success but 0 products
      await prisma.marketIntelSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'success',
          finishedAt: new Date(),
          totalProducts: 0,
        },
      })

      return {
        success: true,
        inserted: 0,
        timestamp: new Date(),
        logId: syncLog.id,
      }
    }

    // Calculate trend scores using Phase 2 batch-aware formula
    const enrichedProducts = calculateTrendScoresForBatch(scraped)

    const now = new Date()
    const data = enrichedProducts.map(item => ({
      siteName: item.siteName,
      category: item.category,
      productName: item.productName,
      price: item.price,
      reviewCount: item.reviewCount,
      position: item.position,
      trendScore: item.trendScore,
      // Cast to InputJsonValue for Prisma compatibility
      rawScoreComponents: item.rawScoreComponents as unknown as Prisma.InputJsonValue,
      productUrl: item.productUrl,
      imageUrl: item.imageUrl,
      collectedAt: now,
    }))

    await prisma.competitorProduct.createMany({ data })

    // Update sync log with success
    await prisma.marketIntelSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        totalProducts: data.length,
      },
    })

    return {
      success: true,
      inserted: data.length,
      timestamp: now,
      logId: syncLog.id,
    }
  } catch (error) {
    // Update sync log with error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await prisma.marketIntelSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'error',
        finishedAt: new Date(),
        errorMessage,
      },
    })

    return {
      success: false,
      inserted: 0,
      timestamp: new Date(),
      logId: syncLog.id,
      error: errorMessage,
    }
  }
}

/**
 * Get recent sync logs for display in the admin UI
 */
export async function getRecentSyncLogs(limit: number = 5) {
  return prisma.marketIntelSyncLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
  })
}
