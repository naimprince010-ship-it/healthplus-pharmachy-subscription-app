import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Tracking } from "@/components/Tracking";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { SessionProvider } from "next-auth/react";
import { PWAProvider } from "@/components/PWAProvider";
import { InstallPrompt, UpdatePrompt } from "@/components/InstallPrompt";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { LoginModal } from "@/components/auth/LoginModal";

export const runtime = 'nodejs'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com';

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Halalzi - Top Ecommerce in Bangladesh",
  description: "Halalzi is a top e-commerce platform in Bangladesh offering authentic medicines, cosmetics, groceries, and baby care products. Enjoy fast home delivery and exclusive discounts.",
  keywords: "ecommerce Bangladesh, online shopping bd, online pharmacy, authentic cosmetics, grocery delivery, baby care products, halalzi, best ecommerce site, fast delivery",
  authors: [{ name: "Halalzi" }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Halalzi',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "Halalzi - Top Ecommerce in Bangladesh",
    description: "Halalzi is a top e-commerce platform in Bangladesh offering authentic medicines, cosmetics, groceries, and baby care products.",
    type: "website",
    locale: "en_BD",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Halalzi - Top Ecommerce in Bangladesh",
    description: "Halalzi is a top e-commerce platform in Bangladesh offering authentic medicines, cosmetics, groceries, and baby care products.",
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-120x120.png', sizes: '120x120' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/icons/apple-touch-icon-167x167.png', sizes: '167x167' },
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Halalzi",
        "url": siteUrl,
        "logo": `${siteUrl}/images/logo.png`,
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+8801700000000",
          "contactType": "customer service"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "Halalzi",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <AuthModalProvider>
            <CartProvider>
              <WishlistProvider>
                <PWAProvider>
                  <Tracking />
                  {children}
                  <UpdatePrompt />
                  <InstallPrompt />
                  <LoginModal />
                </PWAProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthModalProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
