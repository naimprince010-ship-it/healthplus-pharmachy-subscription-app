import { NextRequest, NextResponse } from 'next/server'
import { runMarketIntelSync } from '@/lib/market-intel/sync'
import { requireCronAuth } from '@/lib/cronAuth'

/**
 * Cron job endpoint for Market Intelligence sync
 * 
 * This endpoint is called by Vercel Cron every 6 hours to automatically
 * sync competitor product data from Chaldal and other supported sites.
 * 
 * Authentication: Requires CRON_SECRET header to match CRON_SECRET env var
 * (Vercel automatically adds this header for cron jobs)
 */
export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  console.log('Market intel cron: Starting sync...')

  try {
    const result = await runMarketIntelSync()

    if (!result.success) {
      console.error('Market intel cron: Sync failed', result.error)
      return NextResponse.json(
        { error: 'Sync failed', details: result.error },
        { status: 500 }
      )
    }

    console.log(`Market intel cron: Synced ${result.inserted} products`)
    return NextResponse.json({ 
      success: true,
      inserted: result.inserted,
      timestamp: result.timestamp.toISOString(),
      logId: result.logId,
    })
  } catch (error) {
    console.error('Market intel cron error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
