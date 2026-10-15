import { NextRequest, NextResponse } from 'next/server'
import { runFlashSaleAutoRotation } from '@/lib/flash-sale-engine'
import { checkBearerSecret } from '@/lib/security/bearer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Vercel Cron: GET /api/cron/flash-rotation
 * - Authorization: Bearer {CRON_SECRET}
 * - Clears `flashSaleSource: auto` rows, then assigns new Azan SKUs (see `lib/flash-sale-engine.ts`)
 */
export async function GET(request: NextRequest) {
  const authCheck = checkBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)
  if (authCheck !== 'ok') {
    return NextResponse.json(
      { error: authCheck === 'missing-secret' ? 'Cron authentication is not configured' : 'Unauthorized' },
      { status: authCheck === 'missing-secret' ? 503 : 401 }
    )
  }

  const result = await runFlashSaleAutoRotation()
  if (result.error) {
    return NextResponse.json({ success: false, ...result }, { status: 500 })
  }
  return NextResponse.json({ success: true, ...result })
}
