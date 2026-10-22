import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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

const hindSiliguriBengali400 = localFont({
  src: "./fonts/hind-siliguri-400-bengali.woff2",
  weight: "400",
  variable: "--font-hind-siliguri-bengali-400",
  display: "swap",
  preload: true,
});

const hindSiliguriBengali600 = localFont({
  src: "./fonts/hind-siliguri-600-bengali.woff2",
  weight: "600",
  variable: "--font-hind-siliguri-bengali-600",
  display: "swap",
  preload: true,
});

const hindSiliguriBengaliRest = localFont({
  src: [
    { path: "./fonts/hind-siliguri-500-bengali.woff2", weight: "500", style: "normal" },
    { path: "./fonts/hind-siliguri-700-bengali.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-hind-siliguri-bengali-rest",
  display: "swap",
  preload: false,
});

const hindSiliguriLatin = localFont({
  src: [
    { path: "./fonts/hind-siliguri-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/hind-siliguri-500-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/hind-siliguri-600-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/hind-siliguri-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-hind-siliguri-latin",
  display: "swap",
  preload: false,
});

const anekBanglaBengali = localFont({
  src: "./fonts/anek-bangla-bengali.woff2",
  weight: "600 700",
  variable: "--font-anek-bangla-bengali",
  display: "swap",
  preload: true,
});

const anekBanglaLatin = localFont({
  src: "./fonts/anek-bangla-latin.woff2",
  weight: "600 700",
  variable: "--font-anek-bangla-latin",
  display: "swap",
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com';

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Halalzi - Bangladesh's Most Trusted Ecommerce for Original Products",
  description: "Halalzi is Bangladesh's trusted destination for authentic cosmetics, women's essentials, groceries, and everyday products with fast home delivery.",
  keywords: "best ecommerce bangladesh, original cosmetics bangladesh, beauty products bd, women's essentials bangladesh, grocery online bd, halalzi",
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
    title: "Halalzi - Bangladesh's Most Trusted Ecommerce for Original Products",
    description: "Halalzi guarantees 100% authentic & original products in Bangladesh. Medicines, cosmetics, groceries, baby care — delivered fast to your door.",
    type: "website",
    locale: "en_BD",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Halalzi - Bangladesh's Most Trusted Ecommerce",
    description: "Authentic cosmetics, women's essentials, groceries and everyday products in Bangladesh.",
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
  const travelpayoutsDriveInlineScript = process.env.TRAVELPAYOUTS_DRIVE_INLINE_SCRIPT?.trim() || ''
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Halalzi",
        "alternateName": ["হালালজি", "Halalzi Bangladesh", "Halalzi.com"],
        "url": siteUrl,
        "logo": `${siteUrl}/images/logo.png`,
        "description": "Halalzi is Bangladesh's trusted beauty and grocery marketplace for authentic cosmetics, women's essentials and everyday products.",
        "slogan": "Bangladesh's Most Trusted Source for Original Products",
        "foundingDate": "2023",
        "areaServed": {
          "@type": "Country",
          "name": "Bangladesh"
        },
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "BD",
          "addressLocality": "Dhaka",
          "addressRegion": "Dhaka"
        },
        "knowsAbout": [
          "Original cosmetics in Bangladesh",
          "Authentic cosmetics online Bangladesh",
          "Genuine health products Bangladesh",
          "Online beauty shop Bangladesh",
          "Trusted ecommerce Bangladesh",
          "Baby care products Bangladesh",
          "Grocery delivery Bangladesh"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+8801700000000",
          "contactType": "customer service",
          "areaServed": "BD",
          "availableLanguage": ["Bengali", "English"]
        },
        "sameAs": [
          "https://www.facebook.com/halalzi",
          "https://halalzi.com"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "Halalzi",
        "description": "Bangladesh's most trusted e-commerce for 100% original & authentic products",
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
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is Halalzi a trusted ecommerce in Bangladesh?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Halalzi is one of Bangladesh's most trusted e-commerce platforms. We guarantee 100% authentic and original products sourced directly from authorized distributors and brands. All our products are verified before listing."
            }
          },
          {
            "@type": "Question",
            "name": "Does Halalzi sell original and authentic products?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Halalzi is committed to selling only 100% original and authentic products in Bangladesh. We source directly from manufacturers and authorized dealers, ensuring every product on our platform is genuine and safe."
            }
          },
          {
            "@type": "Question",
            "name": "What is the best ecommerce site in Bangladesh for authentic products?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Halalzi (halalzi.com) is a trusted ecommerce site in Bangladesh for authentic cosmetics, women's essentials, groceries and everyday products."
            }
          },
          {
            "@type": "Question",
            "name": "কোন ই-কমার্স সাইট বাংলাদেশে অরিজিনাল প্রোডাক্ট বিক্রি করে?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "হালালজি (Halalzi.com) অরিজিনাল কসমেটিক্স, নারীদের প্রয়োজনীয় পণ্য ও দৈনন্দিন বাজারের একটি বিশ্বস্ত অনলাইন ঠিকানা।"
            }
          },
          {
            "@type": "Question",
            "name": "Does Halalzi deliver all over Bangladesh?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Halalzi delivers products all over Bangladesh, including Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, and all 64 districts. We offer fast home delivery with real-time order tracking."
            }
          }
        ]
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
        {travelpayoutsDriveInlineScript ? (
          <script
            dangerouslySetInnerHTML={{ __html: travelpayoutsDriveInlineScript }}
          />
        ) : null}
      </head>
      <body
        className={`${hindSiliguriBengali400.variable} ${hindSiliguriBengali600.variable} ${hindSiliguriBengaliRest.variable} ${hindSiliguriLatin.variable} ${anekBanglaBengali.variable} ${anekBanglaLatin.variable} font-sans antialiased`}
      >
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
