'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Shield, Package, Heart, Baby, Activity, Users, ChevronRight } from 'lucide-react'
import { PrescriptionUploadCard } from '@/components/PrescriptionUploadCard'
import { ProductCard } from '@/components/ProductCard'
import { MembershipBanner, type MembershipBannerSettings } from '@/components/MembershipBanner'
import type { SubscriptionPlan } from '@prisma/client'

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
  membershipBannerSettings: MembershipBannerSettings
  homeSections: HomeSection[]
}

export function MobileHome({ subscriptionPlans, membershipBannerSettings, homeSections }: MobileHomeProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - With Background Image */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-pharmacy.jpg"
            alt="Pharmacy"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-teal-700/60" />
        </div>
        
        {/* Content */}
        <div className="relative px-4 py-10">
          <h1 className="text-2xl font-bold text-white leading-tight">
            আপনার স্বাস্থ্য,<br />আমাদের অগ্রাধিকার
          </h1>
          <p className="mt-2 text-sm text-white/90">
            সাশ্রয়ী মূল্যে নির্ভরযোগ্য সেবা।
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/products"
              className="flex-1 rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-teal-700 shadow-lg"
            >
              এখনই শুরু করুন
            </Link>
            <Link
              href="/subscriptions"
              className="flex-1 rounded-lg border-2 border-white/80 bg-white/10 backdrop-blur-sm px-4 py-3 text-center text-sm font-semibold text-white"
            >
              প্ল্যান দেখুন
            </Link>
          </div>
        </div>
      </section>

      {/* Prescription Upload - MedEasy-style compact card */}
      <section className="px-4 py-6">
        <PrescriptionUploadCard />
      </section>

            {/* Membership Banner - Admin Configurable */}
            {membershipBannerSettings.displayLocations?.includes('home') && (
              <MembershipBanner settings={membershipBannerSettings} variant="mobile" />
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
              <div key={product.id} className="flex-shrink-0 w-40">
                <ProductCard
                  product={{
                    id: product.id,
                    type: product.type || 'GENERAL',
                    name: product.name,
                    slug: product.slug,
                    brandName: product.brandName || null,
                    description: product.description || null,
                    sellingPrice: product.sellingPrice,
                    mrp: product.mrp || null,
                    stockQuantity: product.stockQuantity || 100,
                    imageUrl: product.imageUrl || null,
                    discountPercentage: product.discountPercentage || null,
                    flashSalePrice: product.flashSalePrice || null,
                    flashSaleStart: product.flashSaleStart || null,
                    flashSaleEnd: product.flashSaleEnd || null,
                    isFlashSale: product.isFlashSale || null,
                    category: product.category || { id: '', name: '', slug: '' },
                  }}
                  variant="compact"
                />
              </div>
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
