import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Default settings used when database table doesn't exist yet
const DEFAULT_SETTINGS = {
  isEnabled: true,
  badge: 'Premium Membership',
  headline: 'হালালজি প্রিমিয়াম মেম্বারশিপ',
  subheadline: 'আনলিমিটেড ফ্রি ডেলিভারি, অতিরিক্ত ডিসকাউন্ট এবং ফ্রি ডাক্তার পরামর্শ—সবই এক ছাদের নিচে। আপনার এবং পরিবারের সুস্বাস্থ্যের জন্য সেরা ইনভেস্টমেন্ট।',
  priceText: 'প্যাকেজ শুরু মাত্র ৯৯ টাকা থেকে!',
  ctaLabel: 'সব প্ল্যান দেখুন',
  ctaHref: '/membership',
  features: [
    { iconKey: 'delivery', text: 'আনলিমিটেড ফ্রি ডেলিভারি' },
    { iconKey: 'discount', text: 'ফ্ল্যাট ডিসকাউন্ট' },
    { iconKey: 'doctor', text: 'ডাক্তার কনসালটেশন' },
  ],
  bgColor: '#0b3b32',
  textColor: '#ffffff',
  displayLocations: ['home'],
  imageUrl: null,
  imageAlt: '',
  imageSize: 'medium',
}

export async function GET() {
  try {
    let settings = null
    
    try {
      settings = await prisma.membershipBannerSettings.findFirst()
    } catch {
      // Table might not exist yet (before migration)
      console.log('MembershipBannerSettings table not found, using defaults')
    }

    if (!settings) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

        // Parse JSON fields
        let features = settings.features
        if (typeof features === 'string') {
          features = JSON.parse(features)
        }
        let displayLocations = settings.displayLocations
        if (typeof displayLocations === 'string') {
          displayLocations = JSON.parse(displayLocations)
        }
        if (!Array.isArray(displayLocations)) {
          displayLocations = ['home']
        }
        const parsedSettings = {
          ...settings,
          features,
          displayLocations,
        }

    return NextResponse.json({ settings: parsedSettings })
  } catch (error) {
    console.error('Failed to fetch membership banner settings:', error)
    // Return defaults on error
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }
}
