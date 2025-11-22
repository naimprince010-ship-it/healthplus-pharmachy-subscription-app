import { Activity, Heart, Baby, Users, Package } from 'lucide-react'
import Link from 'next/link'
import type { SubscriptionPlan } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function SubscriptionsPage() {
  const plans = await getSubscriptionPlans()

  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose a monthly plan tailored to your healthcare needs
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-transform hover:scale-105"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                {plan.slug === 'bp-care' && <Activity className="h-8 w-8 text-teal-600" />}
                {plan.slug === 'diabetes' && <Heart className="h-8 w-8 text-teal-600" />}
                {plan.slug === 'baby-care' && <Baby className="h-8 w-8 text-teal-600" />}
                {plan.slug === 'family-pack' && <Users className="h-8 w-8 text-teal-600" />}
                {!['bp-care', 'diabetes', 'baby-care', 'family-pack'].includes(plan.slug) && (
                  <Package className="h-8 w-8 text-teal-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
              <p className="mt-2 text-gray-600">{plan.description}</p>
              <div className="mt-6 flex items-baseline space-x-2">
                <span className="text-5xl font-bold text-gray-900">৳{plan.price}</span>
                <span className="text-xl text-gray-600">/month</span>
              </div>
              <Link
                href={`/subscriptions/${plan.slug}`}
                className="mt-8 block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white transition-colors hover:bg-teal-700"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-gray-50 p-8">
          <h2 className="text-2xl font-bold text-gray-900">Why Subscribe?</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Convenience</h3>
              <p className="mt-2 text-gray-600">
                Get your medicines delivered automatically every month without the hassle of reordering
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cost Savings</h3>
              <p className="mt-2 text-gray-600">
                Save money with our subscription pricing and additional membership discounts
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Never Run Out</h3>
              <p className="mt-2 text-gray-600">
                Ensure you always have your essential medicines on hand with regular deliveries
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
