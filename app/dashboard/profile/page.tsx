import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your account information.
        </p>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm rounded-lg mb-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4 overflow-x-auto">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Dashboard
            </Link>
            <Link href="/dashboard/subscriptions" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Subscriptions
            </Link>
            <Link href="/dashboard/cart" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Cart
            </Link>
            <Link href="/dashboard/orders" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Orders
            </Link>
            <Link href="/dashboard/profile" className="text-blue-600 border-b-2 border-blue-600 py-2 px-1 font-medium">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Profile Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
        </div>
        <div className="px-6 py-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.phone || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.address || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Member Since</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.createdAt && new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
          </dl>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-right">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Account Actions</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <button className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Change Password
          </button>
          <div className="border-t border-gray-200 pt-4">
            <button className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
