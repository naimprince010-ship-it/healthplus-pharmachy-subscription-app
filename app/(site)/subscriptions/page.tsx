import type { SubscriptionPlan } from '@prisma/client'
import { SubscriptionsLanding } from '@/components/subscriptions/SubscriptionsLanding'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    })
  } catch {
    return []
  }
}

export default async function SubscriptionsPage() {
  const plans = await getSubscriptionPlans()

  return <SubscriptionsLanding plans={plans} />
}
