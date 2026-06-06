import { NextRequest, NextResponse } from 'next/server'
import { runMarketIntelSync } from '@/lib/market-intel/sync'

async function runSync(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const cronSecret = process.env.MARKET_INTEL_CRON_SECRET

  // Require matching token when MARKET_INTEL_CRON_SECRET is set.
  if (cronSecret && token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runMarketIntelSync()

    if (!result.success) {
      return NextResponse.json(
        { error: 'Sync failed', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      inserted: result.inserted,
      timestamp: result.timestamp.toISOString(),
      logId: result.logId,
    })
  } catch (error) {
    console.error('Market intel sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 })
}

export async function POST(req: NextRequest) {
  return runSync(req)
}
