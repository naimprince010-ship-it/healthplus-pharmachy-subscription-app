import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions)
  
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session?.user?.id },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  })
  
  const memberships = await prisma.membership.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' }
  })
  
  const availablePlans = await prisma.medicinePlan.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions & Memberships</h1>
        <p className="mt-2 text-gray-600">
          Manage your active subscriptions and explore new plans.
        </p>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm rounded-lg mb-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4 overflow-x-auto">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Dashboard
            </Link>
            <Link href="/dashboard/subscriptions" className="text-blue-600 border-b-2 border-blue-600 py-2 px-1 font-medium">
              Subscriptions
            </Link>
            <Link href="/dashboard/cart" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Cart
            </Link>
            <Link href="/dashboard/orders" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Orders
            </Link>
            <Link href="/dashboard/profile" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Active Subscriptions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Active Subscriptions</h2>
        {subscriptions.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {subscriptions.map((subscription) => (
                <li key={subscription.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{subscription.plan.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{subscription.plan.description}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            subscription.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {subscription.status}
                          </span>
                          <span className="ml-4">
                            Ends: {new Date(subscription.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">৳{subscription.plan.price}</p>
                        <p className="text-sm text-gray-500">per month</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No active subscriptions yet.</p>
          </div>
        )}
      </div>

      {/* Active Memberships */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Memberships</h2>
        {memberships.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {memberships.map((membership) => (
                <li key={membership.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Premium Membership</h3>
                        <p className="mt-1 text-sm text-gray-500">{membership.discount}% discount on all medicines</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            membership.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            membership.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {membership.status}
                          </span>
                          <span className="ml-4">
                            Ends: {new Date(membership.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">৳{membership.price}</p>
                        <p className="text-sm text-gray-500">per month</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">No active memberships. Get one now for exclusive discounts!</p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              Get Membership - ৳100/month
            </button>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Medicine Plans</h2>
        {availablePlans.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => (
              <div key={plan.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900">Includes:</p>
                    <ul className="mt-2 space-y-1">
                      {plan.medicines.slice(0, 3).map((medicine, idx) => (
                        <li key={idx} className="text-sm text-gray-500">• {medicine}</li>
                      ))}
                      {plan.medicines.length > 3 && (
                        <li className="text-sm text-gray-500">• and {plan.medicines.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <p className="text-3xl font-bold text-gray-900">৳{plan.price}</p>
                    <p className="text-sm text-gray-500">per month ({plan.duration} days)</p>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4">
                  <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Subscribe Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No plans available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
