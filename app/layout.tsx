import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Tracking } from "@/components/Tracking";
import { CartProvider } from "@/contexts/CartContext";
import { SessionProvider } from "next-auth/react";
import { PWAProvider } from "@/components/PWAProvider";
import { InstallPrompt } from "@/components/InstallPrompt";

export const runtime = 'nodejs'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
  title: "Halalzi - HealthPlus Pharmacy",
  description: "Affordable medicine subscriptions with 100 BDT membership and 10% discount on all medicines. Monthly plans for BP, Diabetes, Baby Care, and Family Pack.",
  keywords: "pharmacy, medicine, subscription, healthcare, Bangladesh, online pharmacy, medicine delivery, halalzi",
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
    title: "Halalzi - HealthPlus Pharmacy",
    description: "Affordable medicine subscriptions with 100 BDT membership and 10% discount on all medicines.",
    type: "website",
    locale: "en_BD",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Halalzi - HealthPlus Pharmacy",
    description: "Affordable medicine subscriptions with 100 BDT membership and 10% discount on all medicines.",
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
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <CartProvider>
            <PWAProvider>
              <Tracking />
              {children}
              <InstallPrompt />
            </PWAProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
