import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { Footer } from '@/components/Footer'

// Footer settings type
interface FooterSettingsData {
  brandName: string
  brandDescription: string
  drugLicense: string | null
  tradeLicense: string | null
  quickLinks: { label: string; href: string }[]
  quickLinksTitle: string
  supportLinks: { label: string; href: string }[]
  supportLinksTitle: string
  contactTitle: string
  address: string
  phone: string
  email: string | null
  socialLinks: { platform: string; url: string }[]
  googlePlayUrl: string | null
  appStoreUrl: string | null
  copyrightText: string
  developerCredit: string | null
  paymentMethods: { name: string; iconKey: string }[]
  bgColor: string
  textColor: string
  headingColor: string
  hoverColor: string
  copyrightBgColor: string
}

// Default footer settings (used when database table doesn't exist yet)
const DEFAULT_SETTINGS: FooterSettingsData = {
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

export async function SiteFooter() {
  let settings = DEFAULT_SETTINGS

  try {
    const footerSettings = await prisma.footerSettings.findFirst()
    if (footerSettings) {
      settings = {
        brandName: footerSettings.brandName,
        brandDescription: footerSettings.brandDescription,
        drugLicense: footerSettings.drugLicense,
        tradeLicense: footerSettings.tradeLicense,
        quickLinks: footerSettings.quickLinks as typeof DEFAULT_SETTINGS.quickLinks,
        quickLinksTitle: footerSettings.quickLinksTitle,
        supportLinks: footerSettings.supportLinks as typeof DEFAULT_SETTINGS.supportLinks,
        supportLinksTitle: footerSettings.supportLinksTitle,
        contactTitle: footerSettings.contactTitle,
        address: footerSettings.address,
        phone: footerSettings.phone,
        email: footerSettings.email,
        socialLinks: footerSettings.socialLinks as typeof DEFAULT_SETTINGS.socialLinks,
        googlePlayUrl: footerSettings.googlePlayUrl,
        appStoreUrl: footerSettings.appStoreUrl,
        copyrightText: footerSettings.copyrightText,
        developerCredit: footerSettings.developerCredit,
        paymentMethods: footerSettings.paymentMethods as typeof DEFAULT_SETTINGS.paymentMethods,
        bgColor: footerSettings.bgColor,
        textColor: footerSettings.textColor,
        headingColor: footerSettings.headingColor,
        hoverColor: footerSettings.hoverColor,
        copyrightBgColor: footerSettings.copyrightBgColor,
      }
    }
  } catch (err) {
    // Handle case where FooterSettings table doesn't exist yet (before migration)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2021'
    ) {
      console.warn(
        'FooterSettings table does not exist yet; using default settings.',
      )
    } else {
      console.error('Failed to fetch footer settings:', err)
    }
    // Use default settings on error
  }

  return <Footer settings={settings} />
}
