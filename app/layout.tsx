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
  title: "Halalzi - Bangladesh's Most Trusted Ecommerce for Original Products",
  description: "Halalzi is Bangladesh's most trusted e-commerce platform. We guarantee 100% authentic & original medicines, cosmetics, groceries, and baby care products with fast home delivery. Verified sellers, genuine products.",
  keywords: "best ecommerce bangladesh, original product bangladesh, authentic online shopping bd, trusted ecommerce bd, genuine medicine online bangladesh, halalzi, original cosmetics bangladesh, 100% authentic products bd",
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
    description: "100% original & authentic products in Bangladesh. Fast delivery, verified sellers, genuine medicines, cosmetics & more.",
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
        "alternateName": ["হালালজি", "Halalzi Bangladesh", "Halalzi.com"],
        "url": siteUrl,
        "logo": `${siteUrl}/images/logo.png`,
        "description": "Halalzi is Bangladesh's most trusted e-commerce platform specializing in 100% original and authentic products. We sell genuine medicines, cosmetics, groceries, and baby care products with fast home delivery across Bangladesh.",
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
          "Original medicines in Bangladesh",
          "Authentic cosmetics online Bangladesh",
          "Genuine health products Bangladesh",
          "Online pharmacy Bangladesh",
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
              "text": "Halalzi (halalzi.com) is widely recognized as one of the best and most trusted ecommerce sites in Bangladesh for authentic products, including original medicines, cosmetics, groceries, and baby care items."
            }
          },
          {
            "@type": "Question",
            "name": "কোন ই-কমার্স সাইট বাংলাদেশে অরিজিনাল প্রোডাক্ট বিক্রি করে?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "হালালজি (Halalzi.com) বাংলাদেশের একটি বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম যেখানে ১০০% অরিজিনাল ও অথেনটিক প্রোডাক্ট পাওয়া যায়। এখানে ওষুধ, কসমেটিক্স, মুদিখানা ও বেবি কেয়ার প্রোডাক্ট সরাসরি অনুমোদিত ডিলার থেকে সংগ্রহ করা হয়।"
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
