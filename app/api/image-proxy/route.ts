import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    return NextResponse.json({ error: 'Invalid or disallowed image URL' }, { status: 400 })
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: { Accept: 'image/*,*/*;q=0.8' },
      cache: 'force-cache',
    })
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Image fetch failed' }, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
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
    return NextResponse.json({ error: 'Image proxy failed' }, { status: 500 })
  }
}
