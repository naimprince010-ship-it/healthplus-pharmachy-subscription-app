import type { NextConfig } from "next";
import { isMedicineShopEnabled } from "./lib/site-features";

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
    staticGenerationMaxConcurrency: 2,
  },
  images: {
    // next/image rejects same-origin URLs with ?query unless explicitly allowed (e.g. /api/image-proxy?url=...).
    localPatterns: [
      { pathname: "/api/image-proxy" },
      { pathname: "/api/image-proxy/**" },
      { pathname: "/banners/**" },
      { pathname: "/images/**" },
      { pathname: "/icons/**" },
    ],
    remotePatterns: [
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
