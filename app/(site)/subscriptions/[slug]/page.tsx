import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import type { SubscriptionPlan, Zone } from '@prisma/client'
import { MAIN_CONTAINER } from '@/lib/layout'
import { SubscriptionSubscribeSection } from './SubscriptionSubscribeSection'
import { SubscriptionOtherPlans } from '@/components/subscriptions/SubscriptionOtherPlans'
import { SubscriptionPolicyNotes } from '@/components/subscriptions/SubscriptionPolicyNotes'
import {
  getMedicineLinesFromItemsJson,
  getSubscriptionPlanBulletLines,
} from '@/lib/subscription-plan-items'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getSubscriptionPlan(slug: string): Promise<SubscriptionPlan | null> {
  return await prisma.subscriptionPlan.findUnique({
    where: { slug, isActive: true },
  })
}

async function getActiveZones(): Promise<Zone[]> {
  return await prisma.zone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

async function getAllActivePlans(): Promise<SubscriptionPlan[]> {
  return await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })
}

export default async function SubscriptionDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [plan, zones, allPlans] = await Promise.all([
    getSubscriptionPlan(slug),
    getActiveZones(),
    getAllActivePlans(),
  ])

  if (!plan) {
    notFound()
  }

  const medicineLines = getMedicineLinesFromItemsJson(plan)
  const summaryBullets = getSubscriptionPlanBulletLines(plan)
  const hasAnyItems = medicineLines.length > 0 || summaryBullets.length > 0 || Boolean(plan.packageDetailLink)

  const serializedPlan = JSON.parse(JSON.stringify(plan)) as Omit<SubscriptionPlan, 'createdAt' | 'updatedAt'> & {
    createdAt: string | null
    updatedAt: string | null
  }
  const serializedZones = JSON.parse(JSON.stringify(zones)) as Zone[]

  return (
    <div className="bg-gray-50 py-10 sm:py-14">
      <div className={`${MAIN_CONTAINER} max-w-4xl`}>
        <Link
          href="/subscriptions"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          সাবস্ক্রিপশন প্ল্যান
        </Link>

        {plan.bannerImageUrl ? (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img src={plan.bannerImageUrl} alt={plan.name} className="h-52 w-full object-cover sm:h-64" />
          </div>
        ) : null}

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{plan.name}</h1>
          {plan.shortDescription ? (
            <p className="mt-4 text-lg text-gray-600">{plan.shortDescription}</p>
          ) : null}
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-teal-600">৳{plan.priceMonthly.toLocaleString('en-BD')}</span>
            <span className="text-lg text-gray-600">/মাস</span>
          </div>
        </header>

        {hasAnyItems ? (
          <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">প্যাকেজে কী কী আছে</h2>
            <p className="mt-2 text-sm text-gray-600">
              নির্দিষ্ট ডোজ বা প্রেসক্রিপশন ব্যতীত ডাক্তার পরামর্শের ভিত্তিতে উপযুক্ত বিকল্প সরবরাহ করা হয়। নিচে ধারণাটি জানুন;
              চূড়ান্ত তালিকার জন্য সাপোর্টে লিখতে পারেন।
            </p>

            {summaryBullets.length > 0 ? (
              <ul className="mt-5 space-y-2 border-t border-gray-100 pt-5">
                <li className="text-xs font-semibold uppercase tracking-wide text-gray-500">সংক্ষিপ্ত ধারণা</li>
                {summaryBullets.map((line, i) => (
                  <li key={`s-${i}`} className="flex gap-2 text-sm text-gray-800">
                    <span className="text-teal-600">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {medicineLines.length > 0 ? (
              <ul className={`mt-5 space-y-2 ${summaryBullets.length > 0 ? 'border-t border-gray-100 pt-5' : ''}`}>
                <li className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  নির্দিষ্ট ওষুধ / ব্র্যান্ড উদাহরণ
                </li>
                {medicineLines.map((line, i) => (
                  <li key={`m-${i}`} className="flex gap-2 text-sm text-gray-800">
                    <span className="text-teal-600">✓</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : summaryBullets.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">
                এখানে তালিকা আপডেট করা হচ্ছে। তাড়াতাড়ি জানতে সাপোর্টে লিখুন অথবা নিচের লিংক ব্যবহার করুন।
              </p>
            ) : null}

            {plan.packageDetailLink ? (
              <a
                href={plan.packageDetailLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex text-sm font-semibold text-teal-700 underline decoration-teal-300 underline-offset-2 hover:text-teal-900"
              >
                সম্পূর্ণ তালিকা / বিস্তারিত দেখুন ↗
              </a>
            ) : (
              !medicineLines.length &&
              summaryBullets.length > 0 && (
                <p className="mt-4 text-xs text-gray-500">
                  পূর্ণ ব্র্যান্ড ও ডোজের তালিকার জন্য support@halalzi.com বা সাইটের হোয়াটসঅ্যাপে যোগাযোগ করুন।
                </p>
              )
            )}
          </div>
        ) : (
          <p className="mb-10 text-sm text-gray-600">
            পণ্য তালিকা শীঘ্রই যুক্ত করা হচ্ছে। বিস্তারিত জানতে সাপোর্টে লিখুন।
          </p>
        )}

        <div className="mb-10">
          <SubscriptionPolicyNotes variant="detail" />
        </div>

        {/* Subscribe card */}
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-lg sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">সাবস্ক্রিপশন শুরু করুন</h2>
          <p className="mt-2 text-sm text-gray-600">
            ডেলিভারি তথ্য পূরণ করুন। নিচের ফর্মটি শুধুমাত্র <strong className="text-gray-900">লগ ইন ব্যবহারকারীর</strong> জন্য খুলবে।
          </p>

          {zones.length === 0 ? (
            <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-900">
              এখন ডেলিভারি জোন কনফিগার করা নেই। অনুগ্রহ করে পরে চেষ্টা করুন বা সাপোর্টে যোগাযোগ করুন।
            </div>
          ) : (
            <>
              <SubscriptionSubscribeSection slug={slug} plan={serializedPlan} zones={serializedZones} />
              <div className="mt-8 border-t border-gray-100 pt-6 text-xs text-gray-500">
                পেমেন্ট: ডেলিভারির সময় ক্যাশ অন ডেলিভারি (COD) উপলব্ধ। ডেলিভারি সময় ডাক্তারি পরামর্শ ও স্টক অনুযায়ী হতে পারে।
              </div>
            </>
          )}
        </div>

        <SubscriptionOtherPlans plans={allPlans} currentSlug={slug} />
      </div>
    </div>
  )
}
