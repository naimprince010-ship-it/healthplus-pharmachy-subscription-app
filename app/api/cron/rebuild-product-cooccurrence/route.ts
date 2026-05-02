import { NextRequest, NextResponse } from 'next/server'
import { rebuildProductCooccurrence } from '@/lib/rebuild-product-cooccurrence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Vercel Cron: GET /api/cron/rebuild-product-cooccurrence
 * - Authorization: Bearer {CRON_SECRET}
 * - Rebuilds `ProductCooccurrence` from `OrderItem` pairs (item–item co-purchase counts).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await rebuildProductCooccurrence()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log('[Cron] Product co-occurrence rebuilt:', result.pairCount, 'pairs')

    return NextResponse.json({
      success: true,
      pairCount: result.pairCount,
    })
  } catch (error) {
    console.error('[Cron] rebuild-product-cooccurrence error:', error)
    return NextResponse.json(
      { error: 'Failed to rebuild product co-occurrence' },
      { status: 500 }
    )
  }
}
