import { NextRequest, NextResponse } from 'next/server'
import { runDiscountEngine } from '@/lib/discount-engine'
import { checkBearerSecret } from '@/lib/security/bearer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    const authCheck = checkBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)
    if (authCheck !== 'ok') {
      return NextResponse.json(
        { error: authCheck === 'missing-secret' ? 'Cron authentication is not configured' : 'Unauthorized' },
        { status: authCheck === 'missing-secret' ? 503 : 401 }
      )
    }

    const result = await runDiscountEngine()

    console.log('[Cron] Discount engine completed:', {
      rulesProcessed: result.rulesProcessed,
      productsUpdated: result.productsUpdated,
      productsCleared: result.productsCleared,
      errors: result.errors.length,
    })

    return NextResponse.json({
      success: result.success,
      rulesProcessed: result.rulesProcessed,
      productsUpdated: result.productsUpdated,
      productsCleared: result.productsCleared,
    })
  } catch (error) {
    console.error('[Cron] Discount engine error:', error)
    return NextResponse.json(
      { error: 'Failed to run discount engine' },
      { status: 500 }
    )
  }
}
