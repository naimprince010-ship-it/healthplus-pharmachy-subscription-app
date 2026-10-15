import { NextRequest, NextResponse } from 'next/server'
import { runMarketIntelSync } from '@/lib/market-intel/sync'
import { auth } from '@/lib/auth'
import { checkBearerSecret } from '@/lib/security/bearer'

function machineAuthError(req: NextRequest): NextResponse | null {
  const check = checkBearerSecret(req.headers.get('authorization'), process.env.MARKET_INTEL_CRON_SECRET)
  if (check === 'ok') return null
  if (check === 'missing-secret') {
    return NextResponse.json({ error: 'Market intel sync secret is not configured' }, { status: 503 })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

async function runSync() {
  try {
    const result = await runMarketIntelSync()

    if (!result.success) {
      return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
    }

    return NextResponse.json({
      inserted: result.inserted,
      timestamp: result.timestamp.toISOString(),
      logId: result.logId,
    })
  } catch (error) {
    console.error('Market intel sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

/** Machine callers only (Authorization: Bearer MARKET_INTEL_CRON_SECRET); session cookies are not accepted on GET. */
export async function GET(req: NextRequest) {
  const authError = machineAuthError(req)
  if (authError) return authError
  return runSync()
}

/** Admin UI (session) or machine caller (bearer secret). */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role === 'ADMIN') return runSync()

  const authError = machineAuthError(req)
  if (authError) return authError
  return runSync()
}
