import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { SubscriptionForm } from './SubscriptionForm'
import type { SubscriptionPlan, Zone } from '@prisma/client'

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

export default async function SubscriptionDetailPage({ params }: PageProps) {
  const { slug } = await params
  const plan = await getSubscriptionPlan(slug)

  if (!plan) {
    notFound()
  }

  const session = await auth()
  const zones = await getActiveZones()

  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Banner Image */}
        {plan.bannerImageUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img
              src={plan.bannerImageUrl}
              alt={plan.name}
              className="h-64 w-full object-cover"
            />
          </div>
        )}

        {/* Plan Details */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{plan.name}</h1>
          <p className="mt-4 text-lg text-gray-600">{plan.shortDescription}</p>
          <div className="mt-6 flex items-baseline space-x-2">
            <span className="text-5xl font-bold text-teal-600">৳{plan.priceMonthly}</span>
            <span className="text-xl text-gray-600">/month</span>
          </div>
        </div>

        {/* Items Included */}
        {plan.itemsSummary && (
          <div className="mb-12 rounded-2xl bg-gray-50 p-8">
            <h2 className="text-2xl font-bold text-gray-900">This package includes</h2>
            <div className="mt-4 whitespace-pre-line text-gray-700">
              {plan.itemsSummary.split('\n').map((line, index) => (
                <div key={index} className="flex items-start space-x-2 py-1">
                  <span className="text-teal-600">•</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Form */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900">Start Subscription</h2>
          <p className="mt-2 text-gray-600">
            Fill in your details to start your monthly subscription
          </p>
          
          {!session ? (
            <div className="mt-6 rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                You need to be logged in to subscribe.{' '}
                <a
                  href={`/auth/signin?callbackUrl=/subscriptions/${slug}`}
                  className="font-semibold underline hover:text-yellow-900"
                >
                  Sign in here
                </a>
              </p>
            </div>
          ) : (
            <SubscriptionForm plan={plan} zones={zones} />
          )}
        </div>
      </div>
    </div>
  )
}
