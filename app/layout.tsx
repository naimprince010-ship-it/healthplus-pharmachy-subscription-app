import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Tracking } from "@/components/Tracking";
import { CartProvider } from "@/contexts/CartContext";
import { SessionProvider } from "next-auth/react";

export const runtime = 'nodejs'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HealthPlus - Subscription Pharmacy & E-Commerce",
  description: "Affordable medicine subscriptions with 100 BDT membership and 10% discount on all medicines. Monthly plans for BP, Diabetes, Baby Care, and Family Pack.",
  keywords: "pharmacy, medicine, subscription, healthcare, Bangladesh, online pharmacy, medicine delivery",
  authors: [{ name: "HealthPlus" }],
  openGraph: {
    title: "HealthPlus - Subscription Pharmacy & E-Commerce",
    description: "Affordable medicine subscriptions with 100 BDT membership and 10% discount on all medicines.",
    type: "website",
    locale: "en_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: "HealthPlus - Subscription Pharmacy & E-Commerce",
    description: "Affordable medicine subscriptions with 100 BDT membership and 10% discount on all medicines.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://healthplus.com" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <CartProvider>
            <Tracking />
            {children}
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
