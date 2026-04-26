import { NextRequest, NextResponse } from 'next/server'
import { runFlashSaleAutoRotation } from '@/lib/flash-sale-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Vercel Cron: GET /api/cron/flash-rotation
 * - Authorization: Bearer {CRON_SECRET}
 * - Clears `flashSaleSource: auto` rows, then assigns new Azan SKUs (see `lib/flash-sale-engine.ts`)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runFlashSaleAutoRotation()
  if (result.error) {
    return NextResponse.json({ success: false, ...result }, { status: 500 })
  }
  return NextResponse.json({ success: true, ...result })
}
