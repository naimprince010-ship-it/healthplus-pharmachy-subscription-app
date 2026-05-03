import Link from 'next/link'
import {
  Home,
  PillBottle,
  Heart,
  Pill,
  Package,
  RefreshCw,
  Wallet,
  PackageCheck,
} from 'lucide-react'
import type { SubscriptionPlan } from '@prisma/client'
import { getSubscriptionPlanBullets } from '@/lib/subscription-plan-bullets'

interface SubscriptionsLandingProps {
  plans: SubscriptionPlan[]
}

type PlanVisual = {
  Icon: typeof Home
  iconWrap: string
}

const PLAN_VISUAL: Record<string, PlanVisual> = {
  'family-pack': { Icon: Home, iconWrap: 'bg-amber-100 text-amber-700 ring-2 ring-amber-200/80' },
  'baby-care-package': { Icon: PillBottle, iconWrap: 'bg-sky-100 text-sky-600 ring-2 ring-sky-200/80' },
  'bp-care-package': { Icon: Heart, iconWrap: 'bg-rose-100 text-rose-600 ring-2 ring-rose-200/80' },
  'diabetes-care-package': { Icon: Pill, iconWrap: 'bg-orange-100 text-orange-600 ring-2 ring-orange-200/80' },
}

function planVisual(slug: string): PlanVisual {
  return (
    PLAN_VISUAL[slug] ?? {
      Icon: Package,
      iconWrap: 'bg-teal-100 text-teal-700 ring-2 ring-teal-200/70',
    }
  )
}

function isFeaturedPlan(plan: SubscriptionPlan): boolean {
  return plan.isFeatured || plan.slug === 'baby-care-package'
}

export function SubscriptionsLanding({ plans }: SubscriptionsLandingProps) {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white pb-16 lg:pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 px-4 py-12 text-center sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, white 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 inline-flex rounded-full bg-teal-500/25 px-4 py-1.5 text-sm font-semibold text-teal-200 ring-1 ring-teal-400/40">
            মাসিক সাবস্ক্রিপশন
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl sm:leading-tight">
            আপনার পরিবারের জন্য সঠিক প্ল্যান বেছে নিন
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            প্রতি মাসে অটোমেটিক ডেলিভারি, গ্যারান্টিড স্টক এবং বিশেষ ছাড় উপভোগ করুন।
          </p>
        </div>
      </section>

      {/* Plans */}
      <div className="mx-auto max-w-[1480px] px-4 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const featured = isFeaturedPlan(plan)
            const bullets = getSubscriptionPlanBullets(plan)
            const { Icon, iconWrap } = planVisual(plan.slug)

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl bg-white p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${
                  featured
                    ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-slate-50 shadow-teal-900/10 bg-gradient-to-b from-teal-50/95 to-white xl:scale-[1.02] z-[1]'
                    : 'border border-gray-100'
                }`}
              >
                {featured ? (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-teal-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                    সবচেয়ে জনপ্রিয়
                  </div>
                ) : null}

                <div className={`mb-5 flex justify-center ${featured ? 'mt-2' : ''}`}>
                  {plan.bannerImageUrl ? (
                    <div className="h-36 w-full overflow-hidden rounded-xl">
                      <img src={plan.bannerImageUrl} alt={plan.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconWrap}`}
                      aria-hidden
                    >
                      <Icon className="h-8 w-8" strokeWidth={2} />
                    </div>
                  )}
                </div>

                <h2 className="text-center text-xl font-bold text-gray-900">{plan.name}</h2>
                {plan.shortDescription ? (
                  <p className="mt-2 text-center text-sm text-gray-600 line-clamp-2">{plan.shortDescription}</p>
                ) : null}

                <ul className="mt-4 flex flex-1 flex-col gap-2 text-left text-sm text-gray-700">
                  {bullets.map((line, bi) => (
                    <li key={`${plan.id}-${bi}`} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-baseline justify-center gap-1 border-t border-gray-100 pt-6">
                  <span className="text-3xl font-extrabold tabular-nums text-gray-900">৳{plan.priceMonthly.toLocaleString('en-BD')}</span>
                  <span className="text-sm font-medium text-gray-500">/মাস</span>
                </div>

                <Link
                  href={`/subscriptions/${plan.slug}`}
                  className={`mt-5 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                    featured
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 hover:bg-teal-700'
                      : 'border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {featured ? 'সাবস্ক্রাইব করুন' : 'বিস্তারিত দেখুন ↗'}
                </Link>
              </article>
            )
          })}
        </div>

        {/* Trust signals */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-gray-200 bg-white/80 py-6 text-sm text-gray-700">
          {[
            '১০০% অথেনটিক ওষুধ',
            'যেকোনো সময় বাতিল করুন',
            'দ্রুত ডেলিভারি',
          ].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500" aria-hidden />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Why subscribe */}
        <section className="mt-14">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">কেন সাবস্ক্রাইব করবেন?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-gray-600">
            স্বাস্থ্যসেবা যেন আরও সহজ ও নির্ভরযোগ্য হয় — সেটাই আমাদের লক্ষ্য।
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-teal-100 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <RefreshCw className="h-7 w-7 text-blue-600" aria-hidden />
              </div>
              <h3 className="text-lg font-bold text-gray-900">অটোমেটিক ডেলিভারি</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                প্রতি মাসে নিজে থেকেই ওষুধ পৌঁছে যাবে — আবার আবার অর্ডার করার ঝামেলা নেই।
              </p>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-teal-100 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <Wallet className="h-7 w-7 text-amber-600" aria-hidden />
              </div>
              <h3 className="text-lg font-bold text-gray-900">বিশেষ সাশ্রয়</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                সাবস্ক্রাইব করলে এক্সক্লুসিভ ছাড় ও মাসিক প্ল্যানে আরও সাশ্রয়।
              </p>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-teal-100 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
                <PackageCheck className="h-7 w-7 text-teal-600" aria-hidden />
              </div>
              <h3 className="text-lg font-bold text-gray-900">স্টক নিশ্চিত</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                সাবস্ক্রাইবাররা জনপ্রিয় ওষুধে অগ্রাধিকার পান — স্টক শেষ হওয়ার আগেই সরবরাহ।
              </p>
            </div>
          </div>
        </section>

        {/* Spacer for fixed mobile bottom nav */}
        <div className="h-12 lg:hidden" aria-hidden />
      </div>
    </div>
  )
}
