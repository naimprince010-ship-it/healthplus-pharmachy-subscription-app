import { buildProductWhereClause } from '@/lib/homeSections'
import { DesktopHome } from '@/components/DesktopHome'
import { MobileHome } from '@/components/MobileHome'
import { getEffectivePrices } from '@/lib/pricing'
import type { MembershipBannerSettings } from '@/components/MembershipBanner'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Feature {
  iconKey: string
  text: string
}

const DEFAULT_BANNER_SETTINGS: MembershipBannerSettings = {
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
}

async function getSubscriptionPlans() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      take: 4,
    })
  } catch {
    return []
  }
}

async function getMembershipBannerSettings(): Promise<MembershipBannerSettings> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const settings = await prisma.membershipBannerSettings.findFirst()
    if (!settings) {
      return DEFAULT_BANNER_SETTINGS
    }
    let features: Feature[] = DEFAULT_BANNER_SETTINGS.features
    if (settings.features) {
      if (typeof settings.features === 'string') {
        features = JSON.parse(settings.features)
      } else if (Array.isArray(settings.features)) {
        features = settings.features as Feature[]
      }
    }
    return {
      isEnabled: settings.isEnabled,
      badge: settings.badge,
      headline: settings.headline,
      subheadline: settings.subheadline,
      priceText: settings.priceText,
      ctaLabel: settings.ctaLabel,
      ctaHref: settings.ctaHref,
      features,
      bgColor: settings.bgColor,
      textColor: settings.textColor,
    }
  } catch {
    return DEFAULT_BANNER_SETTINGS
  }
}

async function getHomeSections() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const sections = await prisma.homeSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const whereClause = buildProductWhereClause(section)
        const products = await prisma.product.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            sellingPrice: true,
            mrp: true,
            stockQuantity: true,
            brandName: true,
            description: true,
            type: true,
            discountPercentage: true,
            flashSalePrice: true,
            flashSaleStart: true,
            flashSaleEnd: true,
            isFlashSale: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            medicine: {
              select: {
                discountPercentage: true,
              },
            },
          },
          take: section.maxProducts,
        })

        // Map products to flatten medicine.discountPercentage and pre-compute effective prices
        // Pre-computing on server prevents hydration mismatch from Date() differences
        const mappedProducts = products.map((product) => {
          const rawDiscount = product.discountPercentage ?? product.medicine?.discountPercentage
          const discountPercentage = rawDiscount ? Number(rawDiscount) : null
          
          // Pre-compute effective prices on server to avoid hydration mismatch
          const effectivePrices = getEffectivePrices({
            sellingPrice: Number(product.sellingPrice),
            mrp: product.mrp ? Number(product.mrp) : null,
            discountPercentage,
            flashSalePrice: product.flashSalePrice ? Number(product.flashSalePrice) : null,
            flashSaleStart: product.flashSaleStart,
            flashSaleEnd: product.flashSaleEnd,
            isFlashSale: product.isFlashSale,
          })
          
          return {
            ...product,
            discountPercentage,
            // Pre-computed values for client to use directly (avoids hydration mismatch)
            effectivePrice: effectivePrices.price,
            effectiveMrp: effectivePrices.mrp,
            effectiveDiscountPercent: effectivePrices.discountPercent,
            isFlashSaleActive: effectivePrices.isFlashSale,
          }
        })

        return {
          section: {
            id: section.id,
            title: section.title,
            slug: section.slug,
            badgeText: section.badgeText,
            bgColor: section.bgColor,
          },
          products: mappedProducts,
        }
      })
    )

    return sectionsWithProducts.filter((s) => s.products.length > 0)
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [subscriptionPlans, membershipBannerSettings, homeSections] = await Promise.all([
    getSubscriptionPlans(),
    getMembershipBannerSettings(),
    getHomeSections(),
  ])

  return (
    <>
      {/* Desktop View - lg and above */}
      <div className="hidden lg:block">
        <DesktopHome 
          subscriptionPlans={subscriptionPlans}
          membershipBannerSettings={membershipBannerSettings}
          homeSections={homeSections}
        />
      </div>

      {/* Mobile View - below lg */}
      <div className="block lg:hidden">
        <MobileHome 
          subscriptionPlans={subscriptionPlans}
          membershipBannerSettings={membershipBannerSettings}
          homeSections={homeSections}
        />
      </div>
    </>
  )
}
