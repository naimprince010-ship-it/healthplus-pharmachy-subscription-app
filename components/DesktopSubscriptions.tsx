import { Activity, Heart, Baby, Users, Package, Calendar, Wallet, PackageCheck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { SubscriptionPlan } from '@prisma/client'

interface DesktopSubscriptionsProps {
  plans: SubscriptionPlan[]
}

export function DesktopSubscriptions({ plans }: DesktopSubscriptionsProps) {
  return (
    <div className="bg-gradient-to-b from-teal-50/50 to-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Subscription Plans</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Choose a monthly plan tailored to your healthcare needs and enjoy premium benefits, guaranteed savings, and endless peace of mind.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-center">
          {plans.map((plan, index) => {
            const isMostPopular = index === 1 // Highlight the middle plan (or specific slug like 'family-pack')

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${isMostPopular
                    ? 'border-2 border-teal-500 shadow-xl lg:scale-105 z-10'
                    : 'border border-gray-100 shadow-lg'
                  }`}
              >
                {isMostPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1 text-sm font-bold text-white shadow-md">
                    Most Popular
                  </div>
                )}

                {plan.bannerImageUrl ? (
                  <div className="mb-6 h-48 w-full overflow-hidden rounded-xl">
                    <img
                      src={plan.bannerImageUrl}
                      alt={plan.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${isMostPopular ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-600'}`}>
                    {plan.slug === 'bp-care-package' && <Activity className="h-8 w-8" />}
                    {plan.slug === 'diabetes-care-package' && <Heart className="h-8 w-8" />}
                    {plan.slug === 'baby-care-package' && <Baby className="h-8 w-8" />}
                    {plan.slug === 'family-pack' && <Users className="h-8 w-8" />}
                    {!['bp-care-package', 'diabetes-care-package', 'baby-care-package', 'family-pack'].includes(plan.slug) && (
                      <Package className="h-8 w-8" />
                    )}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                <p className="mt-3 text-sm text-gray-600 flex-grow">{plan.shortDescription}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-900">৳{plan.priceMonthly}</span>
                  <span className="text-lg font-medium text-gray-500">/mo</span>
                </div>

                <Link
                  href={`/subscriptions/${plan.slug}`}
                  className={`mt-8 block w-full rounded-xl py-3.5 text-center text-lg font-semibold transition-all ${isMostPopular
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                    }`}
                >
                  Subscribe Now
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-24 rounded-3xl bg-white p-10 shadow-xl border border-teal-50">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Subscribe with Us?</h2>
            <p className="mt-3 text-gray-600 text-lg">Experience healthcare that is entirely tailored to your comfort.</p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <Calendar className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Automated Convenience</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Get your medicines delivered automatically every month without the hassle of reordering. We remember so you do not have to.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <Wallet className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Massive Savings</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Save significantly with our customized subscription pricing and unlock exclusive membership discounts.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <ShieldCheck className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Guaranteed Stock</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Never run out of essential meds again. Subscribers get priority stock allocation and reliable delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
