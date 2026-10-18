import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMedicineShopEnabled } from '@/lib/site-features'

export const dynamic = 'force-dynamic'

function sitemapResponse(urlEntries = '') {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com'

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(!isMedicineShopEnabled()
          ? { type: 'GENERAL' as const, NOT: { category: { isMedicineCategory: true } } }
          : {}),
      },
      select: {
        slug: true,
        updatedAt: true,
        type: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const urlEntries = products
      .map(
        (product) => {
          const path = product.type === 'MEDICINE' ? 'medicines' : 'products'
          return `  <url>
    <loc>${baseUrl}/${path}/${product.slug}</loc>
    <lastmod>${product.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
        }
      )
      .join('\n')

    return sitemapResponse(urlEntries)
  } catch (error) {
    console.error('[Product sitemap] Unable to load products:', error)
    return sitemapResponse()
  }
}
