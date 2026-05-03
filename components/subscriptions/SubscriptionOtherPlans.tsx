import Link from 'next/link'
import type { SubscriptionPlan } from '@prisma/client'

interface SubscriptionOtherPlansProps {
  plans: SubscriptionPlan[]
  currentSlug: string
}

/** Compact cards linking to sibling subscription plans on the detail page. */
export function SubscriptionOtherPlans({ plans, currentSlug }: SubscriptionOtherPlansProps) {
  const others = plans.filter((p) => p.slug !== currentSlug && p.isActive)

  if (others.length === 0) return null

  return (
    <section className="mt-14 border-t border-gray-100 pt-12" aria-label="Other subscription plans">
      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">অন্য প্ল্যান দেখুন</h2>
      <p className="mt-1 text-sm text-gray-600">
        দাম ও সুবিধা তুলে নিয়ে আপনার জন্য সঠিক প্যাকটি বেছে নিন।
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((p) => (
          <Link
            key={p.id}
            href={`/subscriptions/${p.slug}`}
            className="flex flex-col rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm transition hover:border-teal-200 hover:bg-white hover:shadow-md"
          >
            <span className="font-semibold text-gray-900">{p.name}</span>
            {p.shortDescription ? (
              <span className="mt-1 line-clamp-2 text-xs text-gray-600">{p.shortDescription}</span>
            ) : null}
            <span className="mt-3 text-lg font-bold text-teal-700">
              ৳{p.priceMonthly.toLocaleString('en-BD')}
              <span className="text-sm font-normal text-gray-500"> /মাস</span>
            </span>
            <span className="mt-3 text-xs font-semibold text-teal-600">বিস্তারিত →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
