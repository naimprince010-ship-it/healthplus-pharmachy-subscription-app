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
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        ...(!isMedicineShopEnabled() ? { isMedicineCategory: false } : {}),
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const urlEntries = categories
      .map(
        (category) => `  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join('\n')

    return sitemapResponse(urlEntries)
  } catch (error) {
    console.error('[Category sitemap] Unable to load categories:', error)
    return sitemapResponse()
  }
}
