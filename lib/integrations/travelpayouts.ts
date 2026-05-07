const DEFAULT_TRAVELPAYOUTS_API_BASE = 'https://api.travelpayouts.com'

function getTravelpayoutsApiBaseUrl(): string {
  const raw = process.env.TRAVELPAYOUTS_API_BASE_URL || DEFAULT_TRAVELPAYOUTS_API_BASE
  return raw.replace(/\/$/, '')
}

function getTravelpayoutsToken(): string {
  const token = process.env.TRAVELPAYOUTS_API_TOKEN?.trim()
  if (!token) {
    throw new Error('Missing TRAVELPAYOUTS_API_TOKEN')
  }
  return token
}

function buildQueryString(query: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  return params.toString()
}

export async function travelpayoutsGet(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const qs = buildQueryString({
    ...query,
    token: getTravelpayoutsToken(),
    marker: process.env.TRAVELPAYOUTS_MARKER?.trim(),
  })
  const url = `${getTravelpayoutsApiBaseUrl()}${normalizedPath}${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  return { ok: res.ok, status: res.status, data }
}
