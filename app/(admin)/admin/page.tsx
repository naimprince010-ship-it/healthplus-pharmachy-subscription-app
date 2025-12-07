import { Package, Users, ShoppingBag, FileText, Shield, Image, Layout } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">Quick access to all admin modules</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/medicines"
            className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
          >
            <Package className="h-12 w-12 text-teal-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Medicines</h2>
            <p className="mt-2 text-gray-600">Manage medicine inventory and pricing</p>
          </Link>

          <Link
            href="/admin/categories"
            className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
          >
            <Package className="h-12 w-12 text-teal-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Categories</h2>
            <p className="mt-2 text-gray-600">Manage medicine categories</p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
          >
            <ShoppingBag className="h-12 w-12 text-teal-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Orders</h2>
            <p className="mt-2 text-gray-600">View and manage customer orders</p>
          </Link>

          <Link
            href="/admin/subscriptions"
            className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
          >
            <Package className="h-12 w-12 text-teal-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Subscription Plans</h2>
            <p className="mt-2 text-gray-600">Manage subscription packages</p>
          </Link>

          <Link
            href="/admin/membership"
            className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
          >
            <Shield className="h-12 w-12 text-teal-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Membership Plans</h2>
            <p className="mt-2 text-gray-600">Manage membership offerings</p>
          </Link>

          <Link
            href="/admin/banners"
            className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
          >
            <Image className="h-12 w-12 text-teal-600" aria-label="Banners icon" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Banners</h2>
            <p className="mt-2 text-gray-600">Manage promotional banners</p>
          </Link>

          <Link
            href="/admin/users"
            className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
          >
            <Users className="h-12 w-12 text-teal-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Users</h2>
            <p className="mt-2 text-gray-600">Manage customer accounts</p>
          </Link>

                  <Link
                    href="/admin/prescriptions"
                    className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
                  >
                    <FileText className="h-12 w-12 text-teal-600" />
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Prescriptions</h2>
                    <p className="mt-2 text-gray-600">Review uploaded prescriptions</p>
                  </Link>

                  <Link
                    href="/admin/landing-pages"
                    className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-105"
                  >
                    <Layout className="h-12 w-12 text-teal-600" />
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Landing Pages</h2>
                    <p className="mt-2 text-gray-600">Create promotional landing pages</p>
                  </Link>
                </div>
    </div>
  )
}
