import { getStorefrontImageUrl } from '@/lib/image-url'

/** Default OG preview when product has no image (same path as root layout refs). */
export const DEFAULT_PRODUCT_OG_PATH = '/images/default-product.png'

export function getSiteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com').replace(/\/$/, '')
}

/**
 * Follow nested /api/image-proxy?url=… chains (some DB rows store proxied URLs; getStorefrontImageUrl wraps again).
 * Crawlers must get the final HTTPS image origin, not our proxy.
 */
function unwrapImageProxyToDirectUrl(input: string, siteBase: string): string {
  const base = siteBase.replace(/\/$/, '')
  let current = input.trim()
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      const u = /^https?:\/\//i.test(current) ? new URL(current) : new URL(current, `${base}/`)
      const pathNorm = u.pathname.replace(/\/$/, '') || '/'
      if (pathNorm !== '/api/image-proxy') break
      const inner = u.searchParams.get('url')
      if (!inner || !/^https?:\/\//i.test(inner)) break
      current = inner
    } catch {
      break
    }
  }
  return current
}

function urlLooksLikeOurImageProxy(resolvedUrl: string, siteBase: string): boolean {
  const base = siteBase.replace(/\/$/, '')
  try {
    const u = /^https?:\/\//i.test(resolvedUrl) ? new URL(resolvedUrl) : new URL(resolvedUrl, `${base}/`)
    return u.pathname.replace(/\/$/, '') === '/api/image-proxy'
  } catch {
    return resolvedUrl.includes('/api/image-proxy')
  }
}

/**
 * Stable absolute URL for Open Graph / Facebook / Twitter previews.
 * - Unwraps /api/image-proxy?url=... to the original HTTPS URL (crawlers handle this better).
 * - Never returns empty: falls back to site default product image.
 */
export function resolveProductOgImageAbsolute(
  imageUrl: string | null | undefined,
  siteBase: string = getSiteBaseUrl()
): string {
  const base = siteBase.replace(/\/$/, '')
  const fallback = `${base}${DEFAULT_PRODUCT_OG_PATH}`

  const storefront = getStorefrontImageUrl(imageUrl)
  if (!storefront) return fallback

  const candidate = storefront.includes('/api/image-proxy')
    ? unwrapImageProxyToDirectUrl(storefront, base)
    : storefront

  // Do not advertise proxy URLs to link-preview bots (Facebook "corrupted image" etc.).
  if (urlLooksLikeOurImageProxy(candidate, base)) {
    return fallback
  }

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate
  }

  const path = candidate.startsWith('/') ? candidate : `/${candidate}`
  return `${base}${path}`
}

export type ProductOgSource = {
  name: string
  slug: string
  seoTitle?: string | null
  seoDescription?: string | null
  description?: string | null
  seoKeywords?: string | null
  imageUrl?: string | null
  category?: { name: string | null } | null
}

export function buildProductShareMeta(product: ProductOgSource, siteBaseParam?: string) {
  const siteBase = siteBaseParam ?? getSiteBaseUrl()
  const categoryName = product.category?.name || ''
  const shouldHideCategoryInSeoTitle = categoryName.trim().toLowerCase() === 'azan wholesale'
  const safeCategorySuffix = categoryName && !shouldHideCategoryInSeoTitle ? ` - ${categoryName}` : ''
  const title = product.seoTitle || `${product.name}${safeCategorySuffix} | Halalzi`
  const description =
    product.seoDescription ||
    product.description ||
    `Buy ${product.name} online at best price from Halalzi. Fast delivery across Bangladesh.`
  const canonicalPath = `/products/${product.slug}`
  const canonicalUrl = `${siteBase}${canonicalPath}`
  const ogImageAbs = resolveProductOgImageAbsolute(product.imageUrl, siteBase)

  return {
    title,
    description,
    keywords: product.seoKeywords || undefined,
    canonicalPath,
    canonicalUrl,
    ogImageAbs,
  }
}

export function isSocialLinkPreviewBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  const s = userAgent.toLowerCase()
  return (
    s.includes('facebookexternalhit') ||
    s.includes('facebot') ||
    s.includes('twitterbot') ||
    s.includes('linkedinbot') ||
    s.includes('slackbot-linkexpanding') ||
    s.includes('pinterest') ||
    s.includes('discordbot') ||
    s.includes('telegrambot') ||
    s.includes('whatsapp')
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Minimal HTML so crawlers that hit /p/[id] get og tags without relying on redirect + DOM scrape. */
export function buildShortLinkOgHtml(meta: ReturnType<typeof buildProductShareMeta>): string {
  const title = escapeHtml(meta.title)
  const desc = escapeHtml(meta.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300))
  const url = escapeHtml(meta.canonicalUrl)
  const img = escapeHtml(meta.ogImageAbs)

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="og:site_name" content="Halalzi">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${img}">
</head>
<body>
<p><a href="${url}">View product</a></p>
</body>
</html>`
}
