import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const subscriptionInclude = {
  user: {
    select: { name: true, email: true },
  },
  plan: {
    select: { name: true, priceMonthly: true },
  },
} as const

type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionInclude
}>

export default async function SubscriptionsPage() {
  noStore()
  
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  let subscriptions: SubscriptionWithRelations[] = []
  let error: string | null = null

  try {
    subscriptions = await prisma.subscription.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: subscriptionInclude,
    })
  } catch (e) {
    console.error('Error fetching subscriptions:', e)
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          </div>
          <div className="rounded-lg bg-red-50 p-6 text-red-800">
            <h2 className="text-lg font-semibold mb-2">Error Loading Subscriptions</h2>
            <p className="text-sm">Unable to load subscriptions. Please check the database configuration.</p>
            <p className="text-xs mt-2 text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <div className="text-sm text-gray-600">
            Total: {subscriptions.length} subscriptions
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Next Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/admin/subscriptions/${subscription.id}`} className="block">
                      <div className="text-sm font-medium text-gray-900">{subscription.user.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{subscription.user.email || '-'}</div>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {subscription.plan.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ৳{subscription.pricePerPeriod}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          subscription.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : subscription.paymentStatus === 'unpaid'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {subscription.paymentStatus}
                      </span>
                      <span className="text-xs text-gray-500">
                        {subscription.paymentMethod}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {subscription.nextDelivery ? new Date(subscription.nextDelivery).toLocaleDateString() : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        subscription.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : subscription.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : subscription.status === 'paused'
                          ? 'bg-gray-100 text-gray-800'
                          : subscription.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {subscriptions.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No subscriptions found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
