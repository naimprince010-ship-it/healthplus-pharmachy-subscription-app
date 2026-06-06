import { NextRequest, NextResponse } from 'next/server'
import { runFlashSaleAutoRotation } from '@/lib/flash-sale-engine'
import { requireCronAuth } from '@/lib/cronAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Vercel Cron: GET /api/cron/flash-rotation
 * - Authorization: Bearer {CRON_SECRET}
 * - Clears `flashSaleSource: auto` rows, then assigns new Azan SKUs (see `lib/flash-sale-engine.ts`)
 */
export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request)
  if (authError) return authError

  const result = await runFlashSaleAutoRotation()
  if (result.error) {
    return NextResponse.json({ success: false, ...result }, { status: 500 })
  }
  return NextResponse.json({ success: true, ...result })
}
