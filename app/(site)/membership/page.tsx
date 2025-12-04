import { Shield, Check, Star } from 'lucide-react'
import type { MembershipPlan } from '@prisma/client'
import { MAIN_CONTAINER } from '@/lib/layout'
import { PurchaseMembershipButton } from '@/components/PurchaseMembershipButton'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getMembershipPlans(): Promise<MembershipPlan[]> {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: [{ isHighlighted: 'desc' }, { sortOrder: 'asc' }, { price: 'asc' }],
    })
  } catch {
    return []
  }
}

async function getPageSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/membership-settings`, { cache: 'no-store' })
    return await res.json()
  } catch {
    return {
      heroHeadlineBn:
        'প্রতি মাসে ওষুধের খরচ ২০% কমান এবং ডাক্তারের পরামর্শ নিন একদম ফ্রি!',
      heroSubheadlineBn: 'আপনার পরিবারের মাসিক ওষুধ ফুরিয়ে যাওয়া নিয়ে চিন্তিত? আমরা দায়িত্ব নিচ্ছি।',
      guaranteeTextBn: '🔒 কোনো দীর্ঘমেয়াদী চুক্তি নেই — যেকোনো সময় বাতিল করতে পারবেন',
      testimonialsJson: [],
    }
  }
}

function formatSavingsMonthly(plan: MembershipPlan) {
  if (!plan.originalPrice || plan.originalPrice <= plan.price) return null
  const monthlySavings = plan.originalPrice - plan.price
  const yearlySavings = Math.round((monthlySavings * 365) / (plan.durationDays || 30))
  return { monthlySavings, yearlySavings }
}

export default async function MembershipPage() {
  const [plans, settings] = await Promise.all([getMembershipPlans(), getPageSettings()])

  return (
    <div className="bg-white py-12">
      <div className={MAIN_CONTAINER}>
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{settings.heroHeadlineBn}</h1>
          <p className="mt-3 text-base text-gray-600 md:mt-4 md:text-lg">{settings.heroSubheadlineBn}</p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const savings = formatSavingsMonthly(plan as any)
            const benefits: string[] = Array.isArray((plan as any).benefitsJson)
              ? ((plan as any).benefitsJson as string[])
              : [
                  `${plan.discountPercent}% ওষুধে ডিস্কাউন্ট`,
                  `${plan.durationDays} দিনের জন্য বৈধ`,
                  'অগ্রাধিকার ভিত্তিক সাপোর্ট',
                  'আনলিমিটেড ফ্রি ডেলিভারি',
                ]
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-white p-6 shadow-sm transition-transform hover:scale-[1.01] ${
                  (plan as any).isHighlighted ? 'border-amber-400' : 'border-gray-200'
                }`}
              >
                {(plan as any).badge && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                    <Star className="h-3 w-3" /> {(plan as any).badge}
                  </div>
                )}

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                {plan.description && <p className="mt-1 text-sm text-gray-600">{plan.description}</p>}

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">৳{plan.price}</span>
                  <span className="text-sm text-gray-600">/ {plan.durationDays} দিন</span>
                </div>
                {(plan as any).originalPrice && (plan as any).originalPrice > plan.price && (
                  <div className="mt-1 text-sm text-gray-500">
                    <span className="mr-2 line-through">৳{(plan as any).originalPrice}</span>
                    {savings && <span className="text-green-600">(বছরে ৳{savings.yearlySavings} সেভ করুন)</span>}
                  </div>
                )}

                <ul className="mt-6 space-y-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700">
                      <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" /> {b}
                    </li>
                  ))}
                </ul>

                <PurchaseMembershipButton
                  planId={plan.id}
                  ctaText={(plan as any).ctaText || 'Start Saving Today'}
                  isHighlighted={(plan as any).isHighlighted}
                />
              </div>
            )
          })}
        </div>

        {/* Guarantee */}
        <div className="mt-10 rounded-2xl bg-teal-50 p-6 text-center text-sm text-teal-800 md:text-base">
          {settings.guaranteeTextBn}
        </div>

        {/* Testimonials */}
        {Array.isArray(settings.testimonialsJson) && settings.testimonialsJson.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settings.testimonialsJson.map((t: any, i: number) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow">
                <div className="text-sm text-gray-700">“{t.text}”</div>
                <div className="mt-3 text-right text-xs font-semibold text-gray-500">— {t.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
