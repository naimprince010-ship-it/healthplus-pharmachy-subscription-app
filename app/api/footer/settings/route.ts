import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Default footer settings (used when database table doesn't exist yet)
const DEFAULT_SETTINGS = {
  brandName: 'Halalzi',
  brandDescription: 'আপনার পরিবারের সুস্বাস্থ্যের বিশ্বস্ত সঙ্গী। আমরা ১০০% অথেনটিক ঔষধ এবং স্বাস্থ্যপণ্য নিশ্চিত করি।',
  drugLicense: null,
  tradeLicense: null,
  quickLinks: [
    { label: 'হোম', href: '/' },
    { label: 'সব ঔষধ', href: '/products' },
    { label: 'মেম্বারশিপ প্ল্যান', href: '/membership' },
    { label: 'প্রেসক্রিপশন আপলোড', href: '/prescription' },
    { label: 'অফারসমূহ', href: '/offers' },
  ],
  quickLinksTitle: 'কুইক লিংকস',
  supportLinks: [
    { label: 'প্রাইভেসি পলিসি', href: '/pages/privacy' },
    { label: 'রিফান্ড ও রিটার্ন পলিসি', href: '/pages/refund' },
    { label: 'শর্তাবলী', href: '/pages/terms' },
    { label: 'সচরাচর জিজ্ঞাসিত প্রশ্ন', href: '/pages/faq' },
  ],
  supportLinksTitle: 'কাস্টমার সাপোর্ট',
  contactTitle: 'যোগাযোগ',
  address: 'ঢাকা, বাংলাদেশ',
  phone: '01700000000',
  email: null,
  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com' },
    { platform: 'youtube', url: 'https://youtube.com' },
  ],
  googlePlayUrl: null,
  appStoreUrl: null,
  copyrightText: '© 2025 Halalzi. All rights reserved.',
  developerCredit: null,
  paymentMethods: [
    { name: 'bKash', iconKey: 'bkash' },
    { name: 'Nagad', iconKey: 'nagad' },
    { name: 'Visa', iconKey: 'visa' },
    { name: 'Mastercard', iconKey: 'mastercard' },
  ],
  bgColor: '#0b3b32',
  textColor: '#e0e0e0',
  headingColor: '#ffffff',
  hoverColor: '#0A9F6E',
  copyrightBgColor: '#04241e',
}

export async function GET() {
  try {
    let settings = await prisma.footerSettings.findFirst()

    if (!settings) {
      settings = await prisma.footerSettings.create({
        data: {},
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch footer settings:', error)
    // Fall back to safe defaults so preview builds don't fail
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }
}
