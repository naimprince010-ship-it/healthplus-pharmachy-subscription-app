import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  buildProductShareMeta,
  buildShortLinkOgHtml,
  getSiteBaseUrl,
  isSocialLinkPreviewBot,
} from '@/lib/product-og'

export const runtime = 'nodejs'

function siteBaseForOg(request: Request): string {
  try {
    return new URL(request.url).origin.replace(/\/$/, '')
  } catch {
    return getSiteBaseUrl()
  }
}

/**
 * Short product link for social sharing:
 * `/p/[id]` redirects to `/products/[slug]` (stable id; shorter than many SEO slugs).
 *
 * Social crawlers get a minimal HTML shell with og:* tags here so previews do not
 * fall back to unrelated images elsewhere on the product layout (e.g. flash-sale strip).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null, isActive: true },
    select: {
      slug: true,
      name: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      imageUrl: true,
      category: { select: { name: true } },
    },
  })

  if (!product) {
    return NextResponse.redirect(new URL('/products', request.url), 302)
  }

  const ua = request.headers.get('user-agent')
  if (isSocialLinkPreviewBot(ua)) {
    const meta = buildProductShareMeta(
      {
        name: product.name,
        slug: product.slug,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        description: product.description,
        seoKeywords: product.seoKeywords,
        imageUrl: product.imageUrl,
        category: product.category ?? null,
      },
      siteBaseForOg(request)
    )
    const html = buildShortLinkOgHtml(meta)
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    })
  }

  const target = new URL(`/products/${product.slug}`, request.url)
  return NextResponse.redirect(target, 307)
}
