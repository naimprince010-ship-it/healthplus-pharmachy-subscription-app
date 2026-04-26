import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  turbopack: {},
  images: {
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
