'use client'

import { Activity, Heart, Baby, Users, Package, ChevronRight, Check } from 'lucide-react'
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
      <section className="px-4 py-6">
        <div className="space-y-4">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/subscriptions/${plan.slug}`}
              className="block rounded-xl bg-white shadow-md overflow-hidden"
            >
              {plan.bannerImageUrl ? (
                <div className="relative h-40 w-full">
                  <Image
                    src={plan.bannerImageUrl}
                    alt={plan.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
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
              
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">{plan.shortDescription}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 ml-2" />
                </div>
                
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-teal-600">৳{plan.priceMonthly}</span>
                  <span className="text-sm text-gray-600">/month</span>
                </div>

                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                    Subscribe Now
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Subscribe - Compact Cards */}
      <section className="px-4 py-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Why Subscribe?</h2>
        <div className="space-y-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                <Check className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Convenience</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Get your medicines delivered automatically every month without the hassle of reordering
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                <Check className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cost Savings</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Save money with our subscription pricing and additional membership discounts
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                <Check className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Never Run Out</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Ensure you always have your essential medicines on hand with regular deliveries
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
