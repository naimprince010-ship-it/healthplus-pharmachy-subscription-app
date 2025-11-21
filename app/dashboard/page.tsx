import { Package, Shield, Calendar, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <ShoppingBag className="h-12 w-12 text-teal-600" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subscriptions</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <Package className="h-12 w-12 text-teal-600" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Membership</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">Not Active</p>
              </div>
              <Shield className="h-12 w-12 text-gray-400" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Delivery</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">No scheduled</p>
              </div>
              <Calendar className="h-12 w-12 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">Membership Status</h2>
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-gray-600">You don&apos;t have an active membership yet.</p>
              <Link
                href="/membership"
                className="mt-4 inline-block rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Join Now
              </Link>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-gray-600">No orders yet.</p>
              <Link
                href="/medicines"
                className="mt-4 inline-block rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">Active Subscriptions</h2>
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-gray-600">You don&apos;t have any active subscriptions.</p>
            <Link
              href="/subscriptions"
              className="mt-4 inline-block rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Browse Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
