'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Package, Heart, Baby, Activity, Users, Upload, CheckCircle, Truck } from 'lucide-react'
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm'
import { PrescriptionUploadModal } from '@/components/PrescriptionUploadModal'
import { SectionSlider } from '@/components/SectionSlider'
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

interface DesktopHomeProps {
  subscriptionPlans: SubscriptionPlan[]
  membershipPlan: MembershipPlan | null
  homeSections: HomeSection[]
}

export function DesktopHome({ subscriptionPlans, membershipPlan, homeSections }: DesktopHomeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* Prescription Upload Modal - only used on desktop */}
      <PrescriptionUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Hero Section - compact on desktop with CTA button, full form on mobile */}
      <section className="w-full bg-gradient-to-br from-teal-50 to-white py-5 lg:py-4">
        <div className="w-full px-2 sm:px-4">
          {/* Desktop layout: headline + bullet points on left, CTA button on right */}
          <div className="hidden lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
                সাশ্রয়ী মূল্যে ওষুধের জন্য{' '}
                <span className="text-teal-600">আপনার বিশ্বস্ত সঙ্গী</span>
              </h1>
              <p className="mt-3 text-sm text-gray-600 lg:text-base">
                মাসিক ওষুধ প্ল্যানে সাবস্ক্রাইব করুন এবং ১০% পর্যন্ত ডিস্কাউন্ট পান।
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-teal-600" />
                  সব ওষুধে ১০% পর্যন্ত ডিস্কাউন্ট
                </li>
                <li className="flex items-center">
                  <Truck className="mr-2 h-4 w-4 text-teal-600" />
                  ২৪–৪৮ ঘন্টার মধ্যে দ্রুত ডেলিভারি
                </li>
              </ul>
            </div>

            {/* Desktop CTA button to open modal */}
            <div className="flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-teal-700"
              >
                <Upload className="h-5 w-5" />
                প্রেসক্রিপশন আপলোড করুন
              </button>
              <p className="mt-2 text-xs text-gray-500">JPG, JPEG, PNG, PDF • সর্বোচ্চ ৫MB</p>
            </div>
          </div>

          {/* Mobile/Tablet layout: full form inline */}
          <div className="lg:hidden">
            <div className="mb-5">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                সাশ্রয়ী মূল্যে ওষুধের জন্য{' '}
                <span className="text-teal-600">আপনার বিশ্বস্ত সঙ্গী</span>
              </h1>
              <p className="mt-4 text-base text-gray-600">
                মাসিক ওষুধ প্ল্যানে সাবস্ক্রাইব করুন এবং আমাদের ১০০ টাকা মেম্বারশিপে সাশ্রয় করুন। সব ওষুধে ১০% ছাড় পান!
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/membership"
                  className="rounded-lg bg-teal-600 px-5 py-2.5 text-center font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  মেম্বারশিপ নিন
                </Link>
                <Link
                  href="/subscriptions"
                  className="rounded-lg border-2 border-teal-600 px-5 py-2.5 text-center font-semibold text-teal-600 transition-colors hover:bg-teal-50"
                >
                  প্ল্যান দেখুন
                </Link>
              </div>
            </div>
            {/* Mobile inline prescription form */}
            <PrescriptionUploadForm />
          </div>
        </div>
      </section>

      {/* Home Sections - compact spacing on desktop */}
      <div className="space-y-2 py-2 lg:space-y-1 lg:py-1">
        {homeSections.map(({ section, products }) => (
          <SectionSlider key={section.id} section={section} products={products} />
        ))}
      </div>

      {/* Membership Card - full width */}
      {membershipPlan && (
        <section className="w-full py-8 lg:py-12">
          <div className="w-full px-2 sm:px-4">
            <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white shadow-xl sm:p-8 lg:p-12">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                <div>
                  <div className="mb-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold lg:mb-4 lg:px-4 lg:py-2">
                    <Shield className="mr-2 h-4 w-4" />
                    Premium Membership
                  </div>
                  <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">{membershipPlan.name}</h2>
                  <p className="mt-3 text-base text-teal-50 lg:mt-4 lg:text-lg">
                    {membershipPlan.description || 'Get 10% discount on all medicines for 30 days'}
                  </p>
                  <div className="mt-4 flex items-baseline space-x-2 lg:mt-6">
                    <span className="text-4xl font-bold lg:text-5xl">৳{membershipPlan.price}</span>
                    <span className="text-lg text-teal-100 lg:text-xl">/month</span>
                  </div>
                  <ul className="mt-4 space-y-2 lg:mt-6 lg:space-y-3">
                    <li className="flex items-center text-sm lg:text-base">
                      <svg className="mr-2 h-4 w-4 text-teal-200 lg:mr-3 lg:h-5 lg:w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {membershipPlan.discountPercent}% discount on all medicines
                    </li>
                    <li className="flex items-center text-sm lg:text-base">
                      <svg className="mr-2 h-4 w-4 text-teal-200 lg:mr-3 lg:h-5 lg:w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Valid for {membershipPlan.durationDays} days
                    </li>
                    <li className="flex items-center text-sm lg:text-base">
                      <svg className="mr-2 h-4 w-4 text-teal-200 lg:mr-3 lg:h-5 lg:w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Priority customer support
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <Link
                    href="/membership"
                    className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-teal-600 transition-transform hover:scale-105 lg:px-8 lg:py-4 lg:text-lg"
                  >
                    Join Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Subscription Plans - full width */}
      <section className="w-full bg-gray-50 py-8 lg:py-12">
        <div className="w-full px-2 sm:px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Monthly Subscription Plans</h2>
            <p className="mt-3 text-base text-gray-600 lg:mt-4 lg:text-lg">
              Choose a plan that fits your healthcare needs
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-4 lg:gap-6">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="rounded-xl bg-white p-4 shadow-lg transition-transform hover:scale-105 lg:rounded-2xl lg:p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 lg:mb-4 lg:h-12 lg:w-12">
                  {plan.slug === 'bp-care' && <Activity className="h-5 w-5 text-teal-600 lg:h-6 lg:w-6" />}
                  {plan.slug === 'diabetes' && <Heart className="h-5 w-5 text-teal-600 lg:h-6 lg:w-6" />}
                  {plan.slug === 'baby-care' && <Baby className="h-5 w-5 text-teal-600 lg:h-6 lg:w-6" />}
                  {plan.slug === 'family-pack' && <Users className="h-5 w-5 text-teal-600 lg:h-6 lg:w-6" />}
                  {!['bp-care', 'diabetes', 'baby-care', 'family-pack'].includes(plan.slug) && (
                    <Package className="h-5 w-5 text-teal-600 lg:h-6 lg:w-6" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 lg:text-xl">{plan.name}</h3>
                <p className="mt-1.5 text-xs text-gray-600 lg:mt-2 lg:text-sm">{plan.shortDescription}</p>
                <div className="mt-3 flex items-baseline space-x-1 lg:mt-4 lg:space-x-2">
                  <span className="text-2xl font-bold text-gray-900 lg:text-3xl">৳{plan.priceMonthly}</span>
                  <span className="text-sm text-gray-600">/month</span>
                </div>
                <Link
                  href={`/subscriptions/${plan.slug}`}
                  className="mt-4 block w-full rounded-lg bg-teal-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-teal-700 lg:mt-6 lg:py-3"
                >
                  Subscribe Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges - full width */}
      <section className="w-full py-8 lg:py-12">
        <div className="w-full px-2 sm:px-4">
          <div className="grid gap-6 sm:grid-cols-3 lg:gap-8">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 lg:mb-4 lg:h-16 lg:w-16">
                <Shield className="h-6 w-6 text-teal-600 lg:h-8 lg:w-8" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 lg:text-lg">100% Authentic</h3>
              <p className="mt-1.5 text-xs text-gray-600 lg:mt-2 lg:text-sm">All medicines are sourced from licensed distributors</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 lg:mb-4 lg:h-16 lg:w-16">
                <Package className="h-6 w-6 text-teal-600 lg:h-8 lg:w-8" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 lg:text-lg">Fast Delivery</h3>
              <p className="mt-1.5 text-xs text-gray-600 lg:mt-2 lg:text-sm">Get your medicines delivered within 24-48 hours</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 lg:mb-4 lg:h-16 lg:w-16">
                <Heart className="h-6 w-6 text-teal-600 lg:h-8 lg:w-8" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 lg:text-lg">Expert Support</h3>
              <p className="mt-1.5 text-xs text-gray-600 lg:mt-2 lg:text-sm">Our pharmacists are here to help you 24/7</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
