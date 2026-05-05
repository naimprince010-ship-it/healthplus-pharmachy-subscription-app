'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Package, Heart, Baby, Activity, Users, ChevronRight, FileText, Zap } from 'lucide-react'
import { PrescriptionUploadModal } from '@/components/PrescriptionUploadModal'
import { ProductCard, type ProductCardProps } from '@/components/ProductCard'
import type { SubscriptionPlan } from '@prisma/client'
import { isGroceryShopEnabled, isMedicineShopEnabled, isPrescriptionFlowEnabled } from '@/lib/site-features'

interface HomeSection {
  section: {
    id: string
    title: string
    slug: string
    badgeText: string | null
    bgColor: string | null
  }
  products: ProductCardProps[]
}

interface MobileHomeProps {
  subscriptionPlans: SubscriptionPlan[]
  homeSections: HomeSection[]
}

const CATEGORY_LINKS: Array<{
  label: string
  iconSrc: string
  href: string
  kind: 'medicine' | 'grocery' | 'other'
}> = [
  { label: 'ঔষধ', iconSrc: '/icons/categories/medicine.svg', href: '/medicines', kind: 'medicine' },
  {
    label: 'গ্রোসারি',
    iconSrc: '/icons/categories/grocery.svg',
    href: '/products?category=grocery',
    kind: 'grocery',
  },
  {
    label: 'কসমেটিক',
    iconSrc: '/icons/categories/cosmetics.svg',
    href: '/products?category=cosmetics',
    kind: 'other',
  },
  { label: 'বেবি', iconSrc: '/icons/categories/baby.svg', href: '/products?category=baby', kind: 'other' },
  { label: 'সকল', iconSrc: '/icons/categories/all.svg', href: '/products', kind: 'other' },
]

export function MobileHome({ subscriptionPlans, homeSections }: MobileHomeProps) {
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false)

  const categoryStrip = CATEGORY_LINKS.filter((c) => {
    if (c.kind === 'medicine' && !isMedicineShopEnabled()) return false
    if (c.kind === 'grocery' && !isGroceryShopEnabled()) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section — min-height reserves space before the photo paints (CLS). */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[260px] sm:min-h-[300px]">
          <div className="absolute inset-0">
            <Image
              src="/images/hero-pharmacy.jpg"
              alt="Halalzi অনলাইন ফার্মেসি ও হোম ডেলিভারি"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-teal-900/85 to-teal-700/65" />
          </div>

          <div className="relative px-4 py-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-200">
              হালাল শপিং · দ্রুত ডেলিভারি
            </p>
            <h1 className="text-[1.6rem] font-extrabold leading-tight text-white">
              {isMedicineShopEnabled() && isGroceryShopEnabled() && (
                <>
                  ঔষধ, গ্রোসারি ও
                  <br />
                  বেবি ফুড — একটি অ্যাপে।
                </>
              )}
              {isMedicineShopEnabled() && !isGroceryShopEnabled() && (
                <>
                  ঔষধ, কসমেটিক্স ও
                  <br />
                  বেবি কেয়ার — একটি অ্যাপে।
                </>
              )}
              {!isMedicineShopEnabled() && isGroceryShopEnabled() && (
                <>
                  গ্রোসারি, কসমেটিক্স ও
                  <br />
                  বেবি — একটি অ্যাপে।
                </>
              )}
              {!isMedicineShopEnabled() && !isGroceryShopEnabled() && (
                <>
                  কসমেটিক্স ও বেবি কেয়ার
                  <br />
                  — একটি অ্যাপে।
                </>
              )}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              অর্ডার করুন, আমরা পৌঁছে দেব।
            </p>
            <div className="mt-5 flex gap-3">
              <Link
                href="/products"
                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-teal-700 shadow-lg"
              >
                এখনই কিনুন
              </Link>
              <Link
                href="/subscriptions"
                className="flex-1 rounded-xl border-2 border-white/70 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                প্ল্যান দেখুন
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Icon Strip ── */}
      <section className="bg-white px-2 py-3 shadow-sm">
        <div className="flex items-center justify-around gap-1">
          {categoryStrip.map(cat => (
            <Link
              key={cat.href}
              href={cat.href}
              className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all active:scale-95 active:bg-teal-50"
            >
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-slate-50 via-white to-teal-50 shadow-[0_8px_18px_rgba(13,148,136,0.18)]">
                <Image
                  src={cat.iconSrc}
                  alt={cat.label}
                  width={34}
                  height={34}
                  className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.18)]"
                />
              </span>
              <span className="text-[11px] font-semibold text-gray-700">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Compact Prescription + Quick Delivery ── */}
      <section className="px-4 pt-4 pb-2">
        <div
          className={`flex gap-3 ${!isPrescriptionFlowEnabled() ? 'justify-center' : ''}`}
        >
          {isPrescriptionFlowEnabled() && (
            <button
              type="button"
              onClick={() => setIsPrescriptionOpen(true)}
              aria-label="Upload prescription"
              className="flex flex-1 items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-3 shadow-sm text-left"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">প্রেসক্রিপশন</p>
                <p className="text-[11px] text-teal-600 font-semibold">আপলোড করুন →</p>
              </div>
            </button>
          )}

          <Link
            href="/products"
            className={`flex items-center gap-3 rounded-2xl border border-amber-100 bg-white px-4 py-3 shadow-sm ${
              isPrescriptionFlowEnabled() ? 'flex-1' : 'w-full'
            }`}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">দ্রুত ডেলিভারি</p>
              <p className="text-[11px] text-amber-600 font-semibold">ঢাকায় একই দিনে</p>
            </div>
          </Link>
        </div>
      </section>

      <PrescriptionUploadModal isOpen={isPrescriptionOpen} onClose={() => setIsPrescriptionOpen(false)} />

      {/* Home Sections - Horizontal Scrollable */}
      {homeSections.map(({ section, products }, sectionIndex) => (
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
            <Link prefetch href={`/products?section=${section.slug}`} className="text-sm font-medium text-teal-600">
              সবগুলো →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pl-4 pr-8 pb-2 scrollbar-hide">
            {products.map((product, productIndex) => (
              <div key={product.id} className="flex-shrink-0 w-40">
                <ProductCard
                  imagePriority={sectionIndex === 0 && productIndex < 4}
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
                    sizeLabel: product.sizeLabel ?? null,
                    packSize: product.packSize ?? null,
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
