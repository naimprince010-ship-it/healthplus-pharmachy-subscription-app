import type { NextConfig } from "next";
import { isMedicineShopEnabled } from "./lib/site-features";

const mediaRemotePattern = (() => {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_MEDIA_BASE_URL || '')
    if (url.protocol !== 'https:') return []
    return [{ protocol: 'https' as const, hostname: url.hostname, pathname: '/**' }]
  } catch {
    return []
  }
})()

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  turbopack: {},
  // Medicine is no longer sold: send old /medicines links (Google, bookmarks) to the product catalogue.
  async redirects() {
    if (isMedicineShopEnabled()) return []
    return [
      { source: '/medicines', destination: '/products', permanent: true },
      { source: '/medicines/:path*', destination: '/products', permanent: true },
    ]
  },
  async rewrites() {
    return [
      // Dedicated sidebar URL; internally loads Product Import with Chaldal-focused copy.
      {
        source: '/admin/chaldal-import',
        destination: '/admin/product-import?from=chaldal',
      },
    ]
  },
  // Fewer concurrent prerenders ⇒ fewer simultaneous DB connects (matches small pg Pool per worker).
  experimental: {
    staticGenerationMaxConcurrency: 4, // Increased from 2 — delivery pages now use ISR so fewer pages pre-build
  },
  images: {
    // next/image rejects same-origin URLs with ?query unless explicitly allowed (e.g. /api/image-proxy?url=...).
    localPatterns: [
      { pathname: "/api/image-proxy" },
      { pathname: "/api/image-proxy/**" },
      { pathname: "/images/**" },
      { pathname: "/icons/**" },
      { pathname: "/banners/**" },
    ],
    remotePatterns: [
      ...mediaRemotePattern,
      {
        protocol: 'https',
        hostname: 'pub-a682143b371545479b3f06ae550cbc6c.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'antgoexirugyssoddvun.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.azanwholesale.com',
      },
      {
        protocol: 'https',
        hostname: 'staging.azanwholesale.com',
      },
      {
        protocol: 'https',
        hostname: 'extent.azanwholesale.com',
      },
      {
        protocol: 'https',
        hostname: 'azanwholesale.com',
      },
    ],
  },
};

export default nextConfig;
