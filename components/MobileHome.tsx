'use client'

import Link from 'next/link'
import { Shield, Package, Heart, Baby, Activity, Users, ChevronRight } from 'lucide-react'
import { PrescriptionUploadCard } from '@/components/PrescriptionUploadCard'
import Image from 'next/image'
import type { SubscriptionPlan, MembershipPlan } from '@prisma/client'

interface HomeSection {
  section: {
    id: string
    title: string
    slug: string
    badgeText: string | null
    bgColor: string | null
  }
  products: any[]
}

interface MobileHomeProps {
  subscriptionPlans: SubscriptionPlan[]
  membershipPlan: MembershipPlan | null
  homeSections: HomeSection[]
}

export function MobileHome({ subscriptionPlans, membershipPlan, homeSections }: MobileHomeProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Compact for Mobile */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-8 text-white">
        <h1 className="text-2xl font-bold">
          সাশ্রয়ী মূল্যে ওষুধের জন্য আপনার বিশ্বস্ত সঙ্গী
        </h1>
        <p className="mt-3 text-sm text-teal-50">
          মাসিক ওষুধ প্ল্যানে সাবস্ক্রাইব করুন এবং আমাদের মেম্বারশিপে সাশ্রয় করুন
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/membership"
            className="flex-1 rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-teal-600"
          >
            মেম্বারশিপ নিন
          </Link>
          <Link
            href="/subscriptions"
            className="flex-1 rounded-lg border-2 border-white px-4 py-3 text-center text-sm font-semibold text-white"
          >
            প্ল্যান দেখুন
          </Link>
        </div>
      </section>

      {/* Prescription Upload - MedEasy-style compact card */}
      <section className="px-4 py-6">
        <PrescriptionUploadCard />
      </section>

      {/* Membership Card - Prominent on Mobile */}
      {membershipPlan && (
        <section className="px-4 py-4">
          <div className="rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-white shadow-lg">
            <div className="mb-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <Shield className="mr-1.5 h-3.5 w-3.5" />
              Premium Membership
            </div>
            <h2 className="text-2xl font-bold">{membershipPlan.name}</h2>
            <p className="mt-2 text-sm text-teal-50">
              {membershipPlan.description || 'Get 10% discount on all medicines for 30 days'}
            </p>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-4xl font-bold">৳{membershipPlan.price}</span>
              <span className="text-lg text-teal-100">/month</span>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm">
                <svg className="mr-2 h-4 w-4 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {membershipPlan.discountPercent}% discount on all medicines
              </li>
              <li className="flex items-center text-sm">
                <svg className="mr-2 h-4 w-4 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Valid for {membershipPlan.durationDays} days
              </li>
            </ul>
            <Link
              href="/membership"
              className="mt-5 block w-full rounded-lg bg-white py-3 text-center text-sm font-semibold text-teal-600"
            >
              Join Now
            </Link>
          </div>
        </section>
      )}

      {/* Home Sections - Horizontal Scrollable */}
      {homeSections.map(({ section, products }) => (
        <section key={section.id} className="py-4">
          <div className="mb-3 flex items-center justify-between px-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
              {section.badgeText && (
                <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                  {section.badgeText}
                </span>
              )}
            </div>
            <Link href={`/products?section=${section.slug}`} className="text-sm font-medium text-teal-600">
              View All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="flex-shrink-0 w-40 rounded-lg bg-white p-3 shadow-sm"
              >
                {product.imageUrl && (
                  <div className="relative mb-2 h-32 w-full overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{product.category?.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-base font-bold text-teal-600">৳{product.sellingPrice}</span>
                  {product.flashSalePrice && (
                    <span className="text-xs text-gray-400 line-through">৳{product.sellingPrice}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Subscription Plans - Stacked Cards */}
      <section className="px-4 py-6">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">Monthly Subscription Plans</h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose a plan that fits your needs
          </p>
        </div>

        <div className="space-y-3">
          {subscriptionPlans.map((plan) => (
            <Link
              key={plan.id}
              href={`/subscriptions/${plan.slug}`}
              className="block rounded-xl bg-white p-4 shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                  {plan.slug === 'bp-care' && <Activity className="h-6 w-6 text-teal-600" />}
                  {plan.slug === 'diabetes' && <Heart className="h-6 w-6 text-teal-600" />}
                  {plan.slug === 'baby-care' && <Baby className="h-6 w-6 text-teal-600" />}
                  {plan.slug === 'family-pack' && <Users className="h-6 w-6 text-teal-600" />}
                  {!['bp-care', 'diabetes', 'baby-care', 'family-pack'].includes(plan.slug) && (
                    <Package className="h-6 w-6 text-teal-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{plan.shortDescription}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">৳{plan.priceMonthly}</span>
                    <span className="text-sm text-gray-600">/month</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Badges - Compact */}
      <section className="px-4 py-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
              <Shield className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">100% Authentic</h3>
              <p className="text-xs text-gray-600">Licensed distributors only</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
              <Package className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
              <p className="text-xs text-gray-600">Within 24-48 hours</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
              <Heart className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Expert Support</h3>
              <p className="text-xs text-gray-600">24/7 pharmacist help</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Spacing for Navigation */}
      <div className="h-20" />
    </div>
  )
}
