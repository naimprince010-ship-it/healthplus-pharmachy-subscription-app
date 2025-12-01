import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/auth/',
        '/dashboard',
        '/cart$',
        '/checkout$',
        '/orders/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
