import { DesktopHome } from '@/components/DesktopHome'
import { MobileHome } from '@/components/MobileHome'
import { getCuratedHomeData, getHomeSections } from '@/lib/home-page-data'
import { getActiveBanners } from '@/lib/banners'
import { BANNER_LOCATIONS } from '@/lib/banner-constants'
import { getBasicSettings } from '@/lib/settings-server'
import { prisma } from '@/lib/prisma'

/** Loads home catalogue data inside Suspense so the route can paint a shell immediately. */
export async function HomePageDeferred() {
  const now = new Date()
  const [homeSections, curated, desktopBanners, mobileBanners, basicSettings, coupons, cartSettings] = await Promise.all([
    getHomeSections(),
    getCuratedHomeData(),
    getActiveBanners(BANNER_LOCATIONS.HOME_HERO, 'desktop'),
    getActiveBanners(BANNER_LOCATIONS.HOME_HERO, 'mobile'),
    getBasicSettings(),
    prisma.coupon.findMany({
      where: {
        isActive: true,
        discountType: 'PERCENTAGE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ discountAmount: 'desc' }, { createdAt: 'asc' }],
      select: { code: true, discountAmount: true, usageLimit: true, usageCount: true },
    }),
    prisma.cartPageSettings.findFirst({ select: { freeDeliveryThreshold: true } }),
  ])
  const coupon = coupons.find((item) => item.usageLimit === null || item.usageCount < item.usageLimit)
  const offer = coupon ? { code: coupon.code, percentage: Math.round(coupon.discountAmount) } : null
  const shared = {
    homeSections,
    curated,
    offer,
    hotline: basicSettings.storePhone.trim(),
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? '',
    freeDeliveryThreshold: cartSettings?.freeDeliveryThreshold ?? null,
  }

  return (
    <>
      <div className="hidden lg:block">
        <DesktopHome
          {...shared}
          heroBanners={desktopBanners}
        />
      </div>
      <div className="block lg:hidden">
        <MobileHome {...shared} heroBanners={mobileBanners} />
      </div>
    </>
  )
}
