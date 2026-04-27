import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isSearchEngineSyncEnabled, reindexAllProductsToSearchEngine } from '@/lib/search/engine-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const batchSize = Number(body.batchSize || 500)
    const maxBatches = Number(body.maxBatches || 100)

    if (!isSearchEngineSyncEnabled()) {
      return NextResponse.json(
        {
          error: 'Search engine sync is disabled. Set SEARCH_PROVIDER=engine and SEARCH_ENGINE_ENDPOINT.',
        },
        { status: 400 },
      )
    }

    const summary = await reindexAllProductsToSearchEngine({ batchSize, maxBatches })
    return NextResponse.json({
      success: true,
      summary,
      message: 'Reindex completed',
    })
  } catch (error) {
    console.error('[search-reindex] error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reindex failed' },
      { status: 500 },
    )
  }
}

