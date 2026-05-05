import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com'

  const privateRoutes = [
    '/admin/',
    '/api/',
    '/auth/',
    '/dashboard',
    '/cart$',
    '/checkout$',
    '/orders/',
  ]

  return {
    rules: [
      // Standard web crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: privateRoutes,
      },
      // Google AI (Gemini training & AI Overviews)
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: privateRoutes,
      },
      // OpenAI / ChatGPT crawler
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: privateRoutes,
      },
      // ChatGPT user browsing agent
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: privateRoutes,
      },
      // Anthropic / Claude crawler
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: privateRoutes,
      },
      // Perplexity AI crawler
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: privateRoutes,
      },
      // Meta AI crawler
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
        disallow: privateRoutes,
      },
      // Microsoft Copilot / Bing AI
      {
        userAgent: 'bingbot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: privateRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
