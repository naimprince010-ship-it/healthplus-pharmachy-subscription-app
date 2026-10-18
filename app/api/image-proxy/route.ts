import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UPSTREAM_TIMEOUT_MS = 4_000
const FAILURE_CACHE_CONTROL = 'public, max-age=30, s-maxage=300, stale-if-error=600'

function failedResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { 'Cache-Control': FAILURE_CACHE_CONTROL } },
  )
}

const DEFAULT_ALLOWED_HOSTS = [
  'api.azanwholesale.com',
  'staging.azanwholesale.com',
  'extent.azanwholesale.com',
  'azanwholesale.com',
  'euadmin.eurasiasupplies.com',
  'antgoexirugyssoddvun.supabase.co',
]

function getAllowedHosts(): Set<string> {
  const fromUrlEnv = [
    process.env.AZAN_WHOLESALE_BASE_URL,
    ...(process.env.AZAN_WHOLESALE_FALLBACK_BASE_URLS || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  ]
    .map((raw) => {
      try {
        return raw ? new URL(raw).hostname.toLowerCase() : ''
      } catch {
        return ''
      }
    })
    .filter(Boolean)

  const envHosts = (process.env.IMAGE_PROXY_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...DEFAULT_ALLOWED_HOSTS, ...fromUrlEnv, ...envHosts])
}

function isAllowedImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    const host = parsed.hostname.toLowerCase()
    return getAllowedHosts().has(host)
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url') || ''
  if (!rawUrl || !isAllowedImageUrl(rawUrl)) {
    return failedResponse('Invalid or disallowed image URL', 400)
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: { Accept: 'image/*,*/*;q=0.8' },
      cache: 'force-cache',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
    if (!upstream.ok) {
      return failedResponse('Image fetch failed', upstream.status)
    }

    const contentType = upstream.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return failedResponse('Unsupported content type', 415)
    }

    const buffer = await upstream.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Aggressive caching for static supplier images.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('image-proxy failed:', error)
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    return failedResponse(timedOut ? 'Image upstream timed out' : 'Image proxy failed', timedOut ? 504 : 500)
  }
}
