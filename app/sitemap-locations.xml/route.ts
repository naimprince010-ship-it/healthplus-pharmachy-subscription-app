import { NextResponse } from 'next/server'
import { districts } from '@/lib/districts'
import { getAllThanasWithDistrictSlug } from '@/lib/bd-locations'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com'

  const urlEntries = districts
    .map(
      (district) => {
        return `  <url>
    <loc>${baseUrl}/delivery/${district.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      }
    )
    .join('\n')

  // Add the main delivery index page
  const indexPage = `  <url>
    <loc>${baseUrl}/delivery</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`

  const allThanas = getAllThanasWithDistrictSlug()
  const thanaEntries = allThanas
    .map(
      (thana: any) => {
        return `  <url>
    <loc>${baseUrl}/delivery/${thana.districtSlug}/${thana.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      }
    )
    .join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexPage}
${urlEntries}
${thanaEntries}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
