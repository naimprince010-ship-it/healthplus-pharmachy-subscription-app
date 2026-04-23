'use client'

import Link from 'next/link'
import { Package, Heart, Baby, Activity, Users, CheckCircle, Shield } from 'lucide-react'

function AnimatedDeliveryTruck() {
  return (
    <span className="relative mr-2.5 inline-flex h-8 w-20 items-center overflow-hidden">
      <style>{`
        @keyframes truck-drive {
          0%   { transform: translateX(-28px); }
          80%  { transform: translateX(28px); }
          85%  { transform: translateX(26px); }
          90%  { transform: translateX(28px); }
          100% { transform: translateX(28px); }
        }
        @keyframes road-move {
          0%   { transform: translateX(0); }
          80%  { transform: translateX(-32px); }
          100% { transform: translateX(-32px); }
        }
        @keyframes wheel-spin {
          from { transform-origin: center; transform: rotate(0deg); }
          to   { transform-origin: center; transform: rotate(360deg); }
        }
        @keyframes dust-puff {
          0%   { opacity: 0.7; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(-8px) scale(2); }
        }
        @keyframes arrive-bounce {
          0%, 100% { transform: translateX(28px) translateY(0); }
          50%       { transform: translateX(28px) translateY(-2px); }
        }
        .truck-wrap {
          animation: truck-drive 2.8s cubic-bezier(0.4,0,0.2,1) infinite;
        }
        .truck-wrap.arrived {
          animation: arrive-bounce 0.5s ease-in-out 3;
        }
        .wheel { animation: wheel-spin 0.5s linear infinite; }
        .dust  { animation: dust-puff 0.6s ease-out infinite; }
        .road-dash { animation: road-move 2.8s linear infinite; }
      `}</style>

      {/* Road dashes */}
      <svg className="road-dash absolute bottom-0.5 left-0 w-full" height="3" viewBox="0 0 64 3">
        <rect x="0"  y="1" width="10" height="1.5" rx="1" fill="#d1fae5" />
        <rect x="16" y="1" width="10" height="1.5" rx="1" fill="#d1fae5" />
        <rect x="32" y="1" width="10" height="1.5" rx="1" fill="#d1fae5" />
        <rect x="48" y="1" width="10" height="1.5" rx="1" fill="#d1fae5" />
        <rect x="64" y="1" width="10" height="1.5" rx="1" fill="#d1fae5" />
      </svg>

      {/* Truck */}
      <span className="truck-wrap absolute left-0">
        <span className="relative inline-block">
          <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
            {/* Cargo box */}
            <rect x="1" y="3" width="20" height="16" rx="2" fill="#f97316" />
            {/* White stripe */}
            <rect x="1" y="12" width="20" height="3" fill="#fff" opacity="0.2" />
            {/* Cab */}
            <path d="M21 8h7l5 7V22h-12V8z" fill="#ea6a0a" />
            {/* Cab window */}
            <rect x="23" y="10" width="5" height="4" rx="1" fill="#bae6fd" opacity="0.9" />
            {/* Chassis */}
            <rect x="1" y="19" width="32" height="3" rx="1.5" fill="#7c2d12" />
            {/* Wheels */}
            <circle className="wheel" cx="9"  cy="24" r="3.5" fill="#1c1917" />
            <circle cx="9"  cy="24" r="1.5" fill="#fed7aa" />
            <circle className="wheel" cx="28" cy="24" r="3.5" fill="#1c1917" />
            <circle cx="28" cy="24" r="1.5" fill="#fed7aa" />
            {/* Headlight */}
            <rect x="33" y="16" width="2.5" height="1.5" rx="0.5" fill="#fef08a" />
          </svg>
          {/* Halalzi label overlay */}
          <span
            style={{
              position: 'absolute',
              top: '6px',
              left: '1px',
              width: '20px',
              fontSize: '5px',
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
              letterSpacing: '0px',
              lineHeight: 1,
              pointerEvents: 'none',
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 0 2px rgba(0,0,0,0.3)',
            }}
          >
            Halalzi
          </span>
        </span>
        {/* Dust puff */}
        <span className="dust absolute -left-2 bottom-1 h-2 w-2 rounded-full bg-orange-200 opacity-60" />
      </span>
    </span>
  )
}
import { SectionSlider } from '@/components/SectionSlider'
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm'
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

interface DesktopHomeProps {
  subscriptionPlans: SubscriptionPlan[]
  homeSections: HomeSection[]
}

export function DesktopHome({ subscriptionPlans, homeSections }: DesktopHomeProps) {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full bg-white py-5 lg:py-8">
        <div className="w-full px-2 sm:px-4">

          {/* Desktop layout: 55/45 two-column */}
          <div className="hidden lg:flex lg:items-center lg:gap-8 lg:py-2">

            {/* Left 55%: Text + CTAs */}
            <div style={{ flex: '0 0 55%' }}>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl lg:leading-[1.2]">
                ওষুধ, কসমেটিক্স ও গ্রোসারি —<br />
                <span style={{ color: '#0e9a6e' }}>এক জায়গায়, সাশ্রয়ী দামে</span>
              </h1>
              <p className="mt-4 max-w-md text-base text-gray-500 lg:text-lg">
                প্রেসক্রিপশনের ওষুধ, পছন্দের কসমেটিক্স, আর রোজকার গ্রোসারি — অর্ডার করুন, আমরা পৌঁছে দেব।
              </p>

              {/* Badges */}
              <div className="mt-5 flex flex-wrap gap-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#0e9a6e' }}>
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  সব পণ্যে ১০% ছাড়
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#0e9a6e' }}>
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <AnimatedDeliveryTruck />
                  ২৪–৪৮ ঘন্টায় ডেলিভারি
                </span>
              </div>

              {/* Buttons */}
              <div className="mt-7 flex items-center gap-4">
                <Link
                  href="/membership"
                  className="rounded-xl px-7 py-3 text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90"
                  style={{ backgroundColor: '#0e9a6e' }}
                >
                  মেম্বারশিপ নিন
                </Link>
                <Link
                  href="/subscriptions"
                  className="rounded-xl border-2 bg-white px-7 py-3 text-base font-bold transition-all hover:-translate-y-0.5 hover:bg-green-50"
                  style={{ borderColor: '#0e9a6e', color: '#0e9a6e' }}
                >
                  মাসিক প্ল্যান দেখুন
                </Link>
              </div>
            </div>

            {/* Right 45%: Category grid */}
            <div className="rounded-2xl p-5" style={{ flex: '0 0 45%', backgroundColor: '#f0faf5' }}>
              <div className="grid grid-cols-2 gap-3">
                {/* ওষুধ */}
                <Link href="/medicines" className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#dbeafe' }}>
                    <svg className="h-6 w-6" style={{ color: '#378ADD' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-gray-800">ওষুধ</span>
                  <span className="mt-0.5 text-xs text-gray-400">৫০০০+ পণ্য</span>
                </Link>
                {/* কসমেটিক্স */}
                <Link href="/products?category=cosmetics" className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#fce7f3' }}>
                    <svg className="h-6 w-6" style={{ color: '#D4537E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-gray-800">কসমেটিক্স</span>
                  <span className="mt-0.5 text-xs text-gray-400">৩০০০+ পণ্য</span>
                </Link>
                {/* গ্রোসারি */}
                <Link href="/products?category=grocery" className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#dcfce7' }}>
                    <svg className="h-6 w-6" style={{ color: '#639922' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-gray-800">গ্রোসারি</span>
                  <span className="mt-0.5 text-xs text-gray-400">২০০০+ পণ্য</span>
                </Link>
                {/* ফ্লাশ সেল */}
                <Link href="/flash-sale" className="relative flex flex-col items-center rounded-xl border-2 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: '#0e9a6e' }}>
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#d1fae5' }}>
                    <svg className="h-6 w-6" style={{ color: '#0e9a6e' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-gray-800">ফ্লাশ সেল</span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">১০% অফ</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet layout */}
          <div className="lg:hidden">
            <div className="mb-5">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                ওষুধ, কসমেটিক্স ও গ্রোসারি —{' '}
                <span className="text-teal-600">এক জায়গায়, সাশ্রয়ী দামে</span>
              </h1>
              <p className="mt-4 text-base text-gray-600">
                প্রেসক্রিপশনের ওষুধ, পছন্দের কসমেটিক্স, আর রোজকার গ্রোসারি — অর্ডার করুন, আমরা পৌঁছে দেব।
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

      {/* Subscription Plans - full width */}
      <section className="w-full bg-gray-50 py-8 lg:py-12">
        <div className="w-full px-2 sm:px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Monthly Subscription Plans</h2>
            <p className="mt-3 text-base text-gray-600 lg:mt-4 lg:text-lg">
              Choose a plan that fits your healthcare needs
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-4 lg:gap-6 items-stretch">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="flex flex-col rounded-xl bg-white p-4 shadow-lg transition-transform hover:scale-105 lg:rounded-2xl lg:p-6">
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
                <p className="mt-1.5 flex-grow text-xs text-gray-600 lg:mt-2 lg:text-sm">{plan.shortDescription}</p>
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
