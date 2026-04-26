import { prisma } from '@/lib/prisma'
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai'
import { getEffectivePrices, type ProductWithPricing } from '@/lib/pricing'
import { getStorefrontImageUrl } from '@/lib/image-url'

export type FacebookMarketingMode = 'newest' | 'random'

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  sellingPrice: true,
  mrp: true,
  discountPercentage: true,
  flashSalePrice: true,
  flashSaleStart: true,
  flashSaleEnd: true,
  isFlashSale: true,
  campaignPrice: true,
  campaignStart: true,
  campaignEnd: true,
  stockQuantity: true,
  keyFeatures: true,
  brandName: true,
} as const

type ProductForMarketing = NonNullable<
  Awaited<ReturnType<typeof pickProductForMarketing>>
>

function getSiteBaseUrl(): string {
  const u =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
  if (!u) {
    throw new Error('Set NEXT_PUBLIC_SITE_URL (or VERCEL_URL in production) for product and image links')
  }
  if (!/^https?:\/\//i.test(u)) {
    return `https://${u.replace(/^\/+/, '')}`
  }
  return u.replace(/\/$/, '')
}

/**
 * Public image URL for Facebook: prefer direct https (e.g. Supabase); else absolute storefront/proxy path.
 */
export function resolveFacebookImageUrl(
  imageUrl: string | null,
  siteBase: string
): string | null {
  if (!imageUrl?.trim()) return null
  const raw = imageUrl.trim()
  if (/^https?:\/\//i.test(raw)) {
    return raw
  }
  const storefront = getStorefrontImageUrl(imageUrl)
  if (!storefront) return null
  if (storefront.startsWith('http')) return storefront
  const base = siteBase.replace(/\/$/, '')
  return `${base}${storefront.startsWith('/') ? '' : '/'}${storefront}`
}

async function pickProductForMarketing(mode: FacebookMarketingMode) {
  const baseWhere = {
    isActive: true,
    deletedAt: null,
    stockQuantity: { gt: 0 },
  } as const

  if (mode === 'newest') {
    return prisma.product.findFirst({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      select: productSelect,
    })
  }

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product"
    WHERE "isActive" = true
      AND "deletedAt" IS NULL
      AND "stockQuantity" > 0
    ORDER BY RANDOM()
    LIMIT 1
  `
  const id = rows[0]?.id
  if (!id) return null
  return prisma.product.findUnique({
    where: { id },
    select: productSelect,
  })
}

function productToPricing(p: ProductForMarketing): ProductWithPricing {
  return {
    sellingPrice: Number(p.sellingPrice),
    mrp: p.mrp != null ? Number(p.mrp) : null,
    discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : null,
    flashSalePrice: p.flashSalePrice != null ? Number(p.flashSalePrice) : null,
    flashSaleStart: p.flashSaleStart,
    flashSaleEnd: p.flashSaleEnd,
    isFlashSale: p.isFlashSale,
    campaignPrice: p.campaignPrice != null ? Number(p.campaignPrice) : null,
    campaignStart: p.campaignStart,
    campaignEnd: p.campaignEnd,
  }
}

const SYSTEM_PROMPT = `You write short Facebook marketing copy for a Bangladesh e-commerce site (Halalzi).
- Mix Bengali and English naturally (Banglish), friendly and trustworthy.
- Highlight benefits, who it's for, and urgency/quality where appropriate.
- Use ৳ before prices (BDT). Do not use markdown, hashtags, or emojis unless one emoji fits at the end.
- Keep the post readable on mobile: aim for 4–8 short lines, under 1200 characters.
- The customer must be able to order online — sound helpful, not salesy.`

function buildUserPrompt(
  p: ProductForMarketing,
  productUrl: string,
  effective: ReturnType<typeof getEffectivePrices>
) {
  const priceLine = `Price: ৳${effective.price.toFixed(0)}${
    effective.mrp > effective.price
      ? ` (MRP ৳${Math.round(effective.mrp).toString()}${effective.discountPercent > 0 ? `, save ~${effective.discountPercent}%` : ''})`
      : ''
  }`

  return `Product name: ${p.name}
${p.brandName ? `Brand: ${p.brandName}\n` : ''}URL: ${productUrl}
${priceLine}
${p.description ? `Description:\n${p.description.slice(0, 1500)}${p.description.length > 1500 ? '…' : ''}\n` : ''}
${p.keyFeatures ? `Key features:\n${p.keyFeatures.slice(0, 800)}\n` : ''}
Write a single Facebook post body that:
- Uses Banglish
- includes benefits and the price
- includes this exact product link once: ${productUrl}
- ends with a short call to order at Halalzi.`
}

async function generatePostBody(
  p: ProductForMarketing,
  productUrl: string,
  effective: ReturnType<typeof getEffectivePrices>
): Promise<string> {
  const openai = getOpenAIClient()
  const model = process.env.OPENAI_FACEBOOK_MODEL || 'gpt-4o'
  const res = await openai.chat.completions.create({
    model,
    temperature: 0.85,
    max_tokens: 800,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(p, productUrl, effective) },
    ],
  })
  const text = res.choices[0]?.message?.content?.trim()
  if (!text) {
    throw new Error('OpenAI returned empty post text')
  }
  return text
}

const GRAPH = () =>
  (process.env.FACEBOOK_GRAPH_API_VERSION || 'v21.0').replace(/^v?/, 'v')

function getFacebookCreds() {
  const pageId = process.env.FACEBOOK_PAGE_ID
  const token =
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN
  if (!pageId || !token) {
    return null
  }
  return { pageId, token }
}

async function postToFacebookPage(
  pageId: string,
  accessToken: string,
  message: string,
  imageUrl: string | null,
  productUrl: string
): Promise<{ id: string }> {
  const version = GRAPH()
  if (imageUrl) {
    const form = new FormData()
    form.set('url', imageUrl)
    form.set('message', message)
    form.set('access_token', accessToken)
    const r = await fetch(
      `https://graph.facebook.com/${version}/${pageId}/photos`,
      { method: 'POST', body: form }
    )
    const j = (await r.json()) as { id?: string; error?: { message: string; code: number } }
    if (!r.ok || !j.id) {
      throw new Error(
        j.error?.message || `Facebook photos API failed (${r.status})`
      )
    }
    return { id: j.id }
  }

  const form = new FormData()
  form.set('message', message)
  form.set('link', productUrl)
  form.set('access_token', accessToken)
  const r = await fetch(
    `https://graph.facebook.com/${version}/${pageId}/feed`,
    { method: 'POST', body: form }
  )
  const j = (await r.json()) as { id?: string; error?: { message: string } }
  if (!r.ok || !j.id) {
    throw new Error(j.error?.message || `Facebook feed API failed (${r.status})`)
  }
  return { id: j.id }
}

export function isFacebookMarketingConfigured(): boolean {
  return !!getFacebookCreds() && isOpenAIConfigured()
}

export type FacebookMarketingResult = {
  success: true
  mode: FacebookMarketingMode
  dryRun: boolean
  product: { id: string; name: string; slug: string; productUrl: string }
  message: string
  imageUrlUsed: string | null
  facebookPostId?: string
}

/**
 * Picks a product, generates Banglish copy with OpenAI, posts to the Facebook Page (unless dryRun).
 */
export async function runFacebookMarketingJob(input: {
  mode: FacebookMarketingMode
  dryRun?: boolean
}): Promise<FacebookMarketingResult> {
  const { mode, dryRun = false } = input

  if (!isOpenAIConfigured()) {
    throw new Error('OPENAI_API_KEY is not set (required for post generation)')
  }
  if (!dryRun) {
    const creds = getFacebookCreds()
    if (!creds) {
      throw new Error(
        'Missing FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN (or FB_PAGE_ACCESS_TOKEN)'
      )
    }
  }

  const product = await pickProductForMarketing(mode)
  if (!product) {
    throw new Error('No active in-stock product found to promote')
  }

  const siteBase = getSiteBaseUrl()
  const productUrl = `${siteBase}/products/${product.slug}`
  const effective = getEffectivePrices(productToPricing(product))
  const message = await generatePostBody(product, productUrl, effective)
  const imageUrl = resolveFacebookImageUrl(product.imageUrl, siteBase)

  if (dryRun) {
    return {
      success: true,
      mode,
      dryRun: true,
      product: { id: product.id, name: product.name, slug: product.slug, productUrl },
      message,
      imageUrlUsed: imageUrl,
    }
  }

  const creds = getFacebookCreds()!
  const { id: facebookPostId } = await postToFacebookPage(
    creds.pageId,
    creds.token,
    message,
    imageUrl,
    productUrl
  )

  return {
    success: true,
    mode,
    dryRun: false,
    product: { id: product.id, name: product.name, slug: product.slug, productUrl },
    message,
    imageUrlUsed: imageUrl,
    facebookPostId,
  }
}
