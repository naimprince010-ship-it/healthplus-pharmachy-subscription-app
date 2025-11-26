import type { SubscriptionPlan } from '@prisma/client'
import { DesktopSubscriptions } from '@/components/DesktopSubscriptions'
import { MobileSubscriptions } from '@/components/MobileSubscriptions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' }
      ],
    })
  } catch {
    return []
  }
}

export default async function SubscriptionsPage() {
  const plans = await getSubscriptionPlans()

  return (
    <>
      {/* Desktop View - lg and above */}
      <div className="hidden lg:block">
        <DesktopSubscriptions plans={plans} />
      </div>

      {/* Mobile View - below lg */}
      <div className="block lg:hidden">
        <MobileSubscriptions plans={plans} />
      </div>
    </>
  )
}
