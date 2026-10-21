import { isConfiguredMediaUrl, resolveMediaUrl } from '@/lib/media-url'

const IMAGE_PROXY_PATH = '/api/image-proxy'

export function getStorefrontImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  const trimmed = imageUrl.trim()
  if (!trimmed) return null

  // Keep already-local/proxied URLs untouched.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed

  // Only proxy absolute http(s) URLs.
  if (!/^https?:\/\//i.test(trimmed)) return resolveMediaUrl(trimmed)

  if (isConfiguredMediaUrl(trimmed)) return trimmed

  return `${IMAGE_PROXY_PATH}?url=${encodeURIComponent(trimmed)}`
}
