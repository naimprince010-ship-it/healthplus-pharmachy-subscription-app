'use client'

import { Activity, Heart, Baby, Users, Package, ChevronRight, Calendar, Wallet, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { SubscriptionPlan } from '@prisma/client'

interface MobileSubscriptionsProps {
  plans: SubscriptionPlan[]
}

export function MobileSubscriptions({ plans }: MobileSubscriptionsProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-8 text-white">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <p className="mt-2 text-sm text-teal-50">
          Choose a monthly plan tailored to your healthcare needs
        </p>
      </section>

      {/* Plans List - Stacked Cards */}
      <section className="px-4 py-8">
        <div className="space-y-6">
          {plans.map((plan, index) => {
            const isMostPopular = index === 1

            return (
              <Link
                key={plan.id}
                href={`/subscriptions/${plan.slug}`}
                className={`group relative block rounded-3xl bg-white shadow-lg overflow-hidden transition-all active:scale-[0.98] ${isMostPopular ? 'border-2 border-teal-500 shadow-xl ring-4 ring-teal-50' : 'border border-gray-100'
                  }`}
              >
                {isMostPopular && (
                  <div className="absolute top-0 left-0 right-0 z-10 bg-teal-500 py-1.5 text-center text-xs font-bold tracking-wider text-white uppercase">
                    Most Popular
                  </div>
                )}

                <div className={isMostPopular ? 'mt-7' : ''}>
                  {plan.bannerImageUrl ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={plan.bannerImageUrl}
                        alt={plan.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`flex h-40 items-center justify-center ${isMostPopular ? 'bg-gradient-to-br from-teal-500 to-teal-400' : 'bg-gradient-to-br from-teal-50 to-teal-100'}`}>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 shadow-sm backdrop-blur">
                        {plan.slug === 'bp-care-package' && <Activity className="h-8 w-8 text-teal-600" />}
                        {plan.slug === 'diabetes-care-package' && <Heart className="h-8 w-8 text-teal-600" />}
                        {plan.slug === 'baby-care-package' && <Baby className="h-8 w-8 text-teal-600" />}
                        {plan.slug === 'family-pack' && <Users className="h-8 w-8 text-teal-600" />}
                        {!['bp-care-package', 'diabetes-care-package', 'baby-care-package', 'family-pack'].includes(plan.slug) && (
                          <Package className="h-8 w-8 text-teal-600" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h2 className="text-xl font-bold text-gray-900 group-active:text-teal-700 transition-colors">{plan.name}</h2>
                        <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{plan.shortDescription}</p>
                      </div>
                      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 flex items-baseline gap-1 border-t border-gray-50 pt-4">
                      <span className="text-3xl font-extrabold tracking-tight text-gray-900">৳{plan.priceMonthly}</span>
                      <span className="text-sm font-medium text-gray-500">/mo</span>
                    </div>

                    <div className="mt-4">
                      <div className={`flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-colors ${isMostPopular
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                          : 'bg-teal-50 text-teal-700'
                        }`}>
                        Subscribe Now
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Why Subscribe - Compact Premium Cards */}
      <section className="px-4 py-8 pb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Why Subscribe?</h2>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-teal-50">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-50">
                <Calendar className="h-6 w-6 text-teal-600" />
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-gray-900">Automated Convenience</h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  Get your medicines delivered automatically every month without the hassle of reordering.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-teal-50">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-50">
                <Wallet className="h-6 w-6 text-teal-600" />
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-gray-900">Massive Savings</h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  Save instantly with our subscription pricing and additional membership discounts.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-teal-50">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-50">
                <ShieldCheck className="h-6 w-6 text-teal-600" />
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-gray-900">Guaranteed Stock</h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  Never run out. Ensure you always have your essential medicines with regular deliveries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Spacing for Navigation */}
      <div className="h-20" />
    </div>
  )
}
