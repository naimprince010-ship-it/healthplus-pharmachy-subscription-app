import { NextRequest, NextResponse } from 'next/server'
import { travelpayoutsGet } from '@/lib/integrations/travelpayouts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_ENDPOINTS = new Set([
  '/aviasales/v3/prices_for_dates',
  '/v1/prices/cheap',
  '/v1/prices/calendar',
])

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = (searchParams.get('endpoint') || '/v1/prices/cheap').trim()

    if (!ALLOWED_ENDPOINTS.has(endpoint)) {
      return NextResponse.json(
        {
          error: 'Unsupported Travelpayouts endpoint',
          allowedEndpoints: Array.from(ALLOWED_ENDPOINTS),
        },
        { status: 400 },
      )
    }

    const query: Record<string, string | undefined> = {}
    searchParams.forEach((value, key) => {
      if (key === 'endpoint') return
      query[key] = value
    })

    const result = await travelpayoutsGet(endpoint, query)
    return NextResponse.json(result.data, { status: result.status })
  } catch (error) {
    console.error('Travelpayouts search API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Travelpayouts data' },
      { status: 500 },
    )
  }
}
