import { DesktopHome } from '@/components/DesktopHome'
import { MobileHome } from '@/components/MobileHome'
import { getHomeSections, getSubscriptionPlans } from '@/lib/home-page-data'
import { getActiveBanners } from '@/lib/banners'
import { BANNER_LOCATIONS } from '@/lib/banner-constants'

/** Loads home catalogue data inside Suspense so the route can paint a shell immediately. */
export async function HomePageDeferred() {
  const [subscriptionPlans, homeSections, heroBanners] = await Promise.all([
    getSubscriptionPlans(),
    getHomeSections(),
    getActiveBanners(BANNER_LOCATIONS.HOME_HERO, 'desktop'),
  ])

  return (
    <>
      <div className="hidden lg:block">
        <DesktopHome subscriptionPlans={subscriptionPlans} homeSections={homeSections} heroBanners={heroBanners} />
      </div>
      <div className="block lg:hidden">
        <MobileHome subscriptionPlans={subscriptionPlans} homeSections={homeSections} />
      </div>
    </>
  )
}
