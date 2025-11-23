import Link from 'next/link'
import { Shield, Package, Heart, Baby, Activity, Users } from 'lucide-react'
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

async function getMembershipPlan() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.membershipPlan.findFirst({
      where: { isActive: true },
    })
  } catch {
    return null
  }
}

export default async function HomePage() {
  const subscriptionPlans = await getSubscriptionPlans()
  const membershipPlan = await getMembershipPlan()

  return (
    <div className="bg-white">
      {/* Hero Section with Prescription Upload */}
      <section className="bg-gradient-to-br from-teal-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Your Trusted Partner for{' '}
                <span className="text-teal-600">Affordable Medicine</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600">
                Subscribe to monthly medicine plans and save with our 100 BDT membership. Get 10% discount on all medicines!
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/membership"
                  className="rounded-lg bg-teal-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  Join Membership
                </Link>
                <Link
                  href="/subscriptions"
                  className="rounded-lg border-2 border-teal-600 px-6 py-3 text-center font-semibold text-teal-600 transition-colors hover:bg-teal-50"
                >
                  View Plans
                </Link>
              </div>
            </div>

            {/* Prescription Upload Form */}
            <PrescriptionUploadForm />
          </div>
        </div>
      </section>

      {/* Membership Card */}
      {membershipPlan && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-8 text-white shadow-xl md:p-12">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <div className="mb-4 inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
                    <Shield className="mr-2 h-4 w-4" />
                    Premium Membership
                  </div>
                  <h2 className="text-3xl font-bold md:text-4xl">{membershipPlan.name}</h2>
                  <p className="mt-4 text-lg text-teal-50">
                    {membershipPlan.description || 'Get 10% discount on all medicines for 30 days'}
                  </p>
                  <div className="mt-6 flex items-baseline space-x-2">
                    <span className="text-5xl font-bold">৳{membershipPlan.price}</span>
                    <span className="text-xl text-teal-100">/month</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center">
                      <svg className="mr-3 h-5 w-5 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {membershipPlan.discountPercent}% discount on all medicines
                    </li>
                    <li className="flex items-center">
                      <svg className="mr-3 h-5 w-5 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Valid for {membershipPlan.durationDays} days
                    </li>
                    <li className="flex items-center">
                      <svg className="mr-3 h-5 w-5 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Priority customer support
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <Link
                    href="/membership"
                    className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-teal-600 transition-transform hover:scale-105"
                  >
                    Join Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Subscription Plans */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Monthly Subscription Plans</h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose a plan that fits your healthcare needs
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="rounded-2xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                  {plan.slug === 'bp-care' && <Activity className="h-6 w-6 text-teal-600" />}
                  {plan.slug === 'diabetes' && <Heart className="h-6 w-6 text-teal-600" />}
                  {plan.slug === 'baby-care' && <Baby className="h-6 w-6 text-teal-600" />}
                  {plan.slug === 'family-pack' && <Users className="h-6 w-6 text-teal-600" />}
                  {!['bp-care', 'diabetes', 'baby-care', 'family-pack'].includes(plan.slug) && (
                    <Package className="h-6 w-6 text-teal-600" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{plan.shortDescription}</p>
                <div className="mt-4 flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">৳{plan.priceMonthly}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <Link
                  href={`/subscriptions/${plan.slug}`}
                  className="mt-6 block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  Subscribe Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <Shield className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">100% Authentic</h3>
              <p className="mt-2 text-sm text-gray-600">All medicines are sourced from licensed distributors</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <Package className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Fast Delivery</h3>
              <p className="mt-2 text-sm text-gray-600">Get your medicines delivered within 24-48 hours</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <Heart className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Expert Support</h3>
              <p className="mt-2 text-sm text-gray-600">Our pharmacists are here to help you 24/7</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
