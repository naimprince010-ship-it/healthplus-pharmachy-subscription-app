import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  // Fetch user stats
  const subscriptionsCount = await prisma.subscription.count({
    where: { userId: session?.user?.id, status: 'ACTIVE' }
  })
  
  const membershipsCount = await prisma.membership.count({
    where: { userId: session?.user?.id, status: 'ACTIVE' }
  })
  
  const ordersCount = await prisma.order.count({
    where: { userId: session?.user?.id }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your subscriptions, orders, and profile from here.
        </p>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm rounded-lg mb-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4 overflow-x-auto">
            <Link
              href="/dashboard"
              className="text-blue-600 border-b-2 border-blue-600 py-2 px-1 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/subscriptions"
              className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium"
            >
              Subscriptions
            </Link>
            <Link
              href="/dashboard/cart"
              className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium"
            >
              Cart
            </Link>
            <Link
              href="/dashboard/orders"
              className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium"
            >
              Orders
            </Link>
            <Link
              href="/dashboard/profile"
              className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium"
            >
              Profile
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Subscriptions</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{subscriptionsCount}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/dashboard/subscriptions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Memberships</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{membershipsCount}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/dashboard/subscriptions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View details
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{ordersCount}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View history
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/subscriptions"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <h3 className="font-medium text-gray-900">Browse Plans</h3>
            <p className="mt-1 text-sm text-gray-500">View available medicine plans</p>
          </Link>
          <Link
            href="/dashboard/subscriptions"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <h3 className="font-medium text-gray-900">Get Membership</h3>
            <p className="mt-1 text-sm text-gray-500">100 BDT for 10% discount</p>
          </Link>
          <Link
            href="/dashboard/cart"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <h3 className="font-medium text-gray-900">Shop Medicines</h3>
            <p className="mt-1 text-sm text-gray-500">Browse and add to cart</p>
          </Link>
          <Link
            href="/dashboard/orders"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <h3 className="font-medium text-gray-900">Order History</h3>
            <p className="mt-1 text-sm text-gray-500">Track your orders</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
