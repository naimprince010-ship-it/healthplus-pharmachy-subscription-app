const ABSOLUTE_URL = /^https?:\/\//i

function mediaBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim().replace(/\/+$/, '')
  return value || null
}

export function isAbsoluteMediaUrl(value: string): boolean {
  return ABSOLUTE_URL.test(value)
}

export function resolveMediaUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  if (isAbsoluteMediaUrl(trimmed)) return trimmed

  const base = mediaBaseUrl()
  return base ? `${base}/${trimmed.replace(/^\/+/, '')}` : trimmed
}

export function isConfiguredMediaUrl(value: string): boolean {
  const base = mediaBaseUrl()
  if (!base) return false
  try {
    return new URL(value).origin === new URL(base).origin
  } catch {
    return false
  }
}
