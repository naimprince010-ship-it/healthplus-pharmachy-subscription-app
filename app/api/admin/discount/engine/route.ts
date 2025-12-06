import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runDiscountEngine, clearExpiredCampaigns } from '@/lib/discount-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runDiscountEngine()

    return NextResponse.json({
      ...result,
      message: result.success
        ? `Discount engine completed. Processed ${result.rulesProcessed} rules, updated ${result.productsUpdated} products, cleared ${result.productsCleared} expired campaigns.`
        : 'Discount engine completed with errors',
    })
  } catch (error) {
    console.error('Discount engine error:', error)
    return NextResponse.json(
      { error: 'Failed to run discount engine' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clearedCount = await clearExpiredCampaigns()

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} expired campaign prices`,
      clearedCount,
    })
  } catch (error) {
    console.error('Clear expired campaigns error:', error)
    return NextResponse.json(
      { error: 'Failed to clear expired campaigns' },
      { status: 500 }
    )
  }
}
