import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com'
  const now = new Date().toISOString()

  const staticPages = [
    { url: baseUrl, changefreq: 'daily', priority: '1.0' },
    { url: `${baseUrl}/products`, changefreq: 'daily', priority: '0.9' },
    { url: `${baseUrl}/membership`, changefreq: 'weekly', priority: '0.8' },
    { url: `${baseUrl}/subscriptions`, changefreq: 'weekly', priority: '0.8' },
    { url: `${baseUrl}/flash-sale`, changefreq: 'daily', priority: '0.8' },
  ]

  const urlEntries = staticPages
    .map(
      (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n')

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
