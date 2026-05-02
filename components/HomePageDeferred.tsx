import { DesktopHome } from '@/components/DesktopHome'
import { MobileHome } from '@/components/MobileHome'
import { getHomeSections, getSubscriptionPlans } from '@/lib/home-page-data'

/** Loads home catalogue data inside Suspense so the route can paint a shell immediately. */
export async function HomePageDeferred() {
  const [subscriptionPlans, homeSections] = await Promise.all([
    getSubscriptionPlans(),
    getHomeSections(),
  ])

  return (
    <>
      <div className="hidden lg:block">
        <DesktopHome subscriptionPlans={subscriptionPlans} homeSections={homeSections} />
      </div>
      <div className="block lg:hidden">
        <MobileHome subscriptionPlans={subscriptionPlans} homeSections={homeSections} />
      </div>
    </>
  )
}
