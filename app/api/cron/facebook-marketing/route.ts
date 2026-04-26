import { NextRequest, NextResponse } from 'next/server'
import {
  isFacebookMarketingConfigured,
  runFacebookMarketingJob,
  type FacebookMarketingMode,
} from '@/lib/facebook-marketing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

function parseMode(searchParams: URLSearchParams): FacebookMarketingMode {
  const m = (searchParams.get('mode') || 'newest').toLowerCase()
  return m === 'random' ? 'random' : 'newest'
}

/**
 * Vercel Cron: GET /api/cron/facebook-marketing
 * - Authorization: Bearer {CRON_SECRET} (same as other crons in this app)
 * - Query: ?mode=newest|random (default: newest)  ?dryRun=1 (no Facebook post, still uses OpenAI)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mode = parseMode(request.nextUrl.searchParams)
  const dryRun =
    request.nextUrl.searchParams.get('dryRun') === '1' ||
    request.nextUrl.searchParams.get('dryRun') === 'true'

  try {
    if (!dryRun && !isFacebookMarketingConfigured()) {
      return NextResponse.json(
        {
          error: 'Not configured',
          hint: 'Set OPENAI_API_KEY, FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN, and NEXT_PUBLIC_SITE_URL',
        },
        { status: 503 }
      )
    }

    const result = await runFacebookMarketingJob({ mode, dryRun })

    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Cron] Facebook marketing error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
