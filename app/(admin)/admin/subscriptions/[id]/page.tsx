import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { SubscriptionDetailForm } from './SubscriptionDetailForm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SubscriptionDetailPage({ params }: PageProps) {
  noStore()
  
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = await params
  const subscription = await prisma.subscription.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: { name: true, phone: true, email: true },
      },
      plan: true,
      zone: true,
    },
  })

  if (!subscription) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Subscription Details</h1>
        
        <div className="space-y-6">
          {/* Subscription Info */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Subscription Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Subscription ID</p>
                <p className="font-medium text-gray-900">#{subscription.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium text-gray-900">{subscription.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price per Period</p>
                <p className="font-medium text-gray-900">৳{subscription.pricePerPeriod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    subscription.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : subscription.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : subscription.status === 'paused'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(subscription.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Delivery</p>
                <p className="font-medium text-gray-900">
                  {new Date(subscription.nextDelivery).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{subscription.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{subscription.user.phone}</p>
              </div>
              {subscription.user.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{subscription.user.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Delivery Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{subscription.address}</p>
              </div>
              {subscription.zone && (
                <div>
                  <p className="text-sm text-gray-500">Zone</p>
                  <p className="font-medium text-gray-900">
                    {subscription.zone.name} - ৳{subscription.zone.deliveryFee || subscription.zone.deliveryCharge} delivery
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Management Form */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Manage Subscription</h2>
            <SubscriptionDetailForm subscription={subscription} />
          </div>
        </div>
      </div>
    </div>
  )
}
