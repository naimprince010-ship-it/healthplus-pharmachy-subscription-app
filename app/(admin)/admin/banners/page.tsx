import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { BANNER_LOCATION_LABELS, DEVICE_LABELS } from '@/lib/banner-constants'

export const dynamic = 'force-dynamic'

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; isActive?: string }>
}) {
  noStore()
  
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const params = await searchParams
  const locationFilter = params.location || 'all'
  const isActiveFilter = params.isActive || 'all'

  const where: any = {}

  if (locationFilter !== 'all') {
    where.location = locationFilter
  }

  if (isActiveFilter !== 'all') {
    where.isActive = isActiveFilter === 'true'
  }

  const banners = await prisma.banner.findMany({
    where,
    orderBy: [{ location: 'asc' }, { order: 'asc' }],
  })

  const formatSchedule = (startAt: Date | null, endAt: Date | null) => {
    if (!startAt && !endAt) return 'Always'
    if (startAt && !endAt) return `From ${new Date(startAt).toLocaleDateString()}`
    if (!startAt && endAt) return `Until ${new Date(endAt).toLocaleDateString()}`
    return `${new Date(startAt!).toLocaleDateString()} - ${new Date(endAt!).toLocaleDateString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your site banners and promotional content
            </p>
          </div>
          <Link
            href="/admin/banners/new"
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Create Banner
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 rounded-lg bg-white p-4 shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => {
                const url = new URL(window.location.href)
                url.searchParams.set('location', e.target.value)
                window.location.href = url.toString()
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Locations</option>
              <option value="HOME_HERO">Home Hero</option>
              <option value="HOME_MID">Home Mid Section</option>
              <option value="CATEGORY_TOP">Category Top</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={isActiveFilter}
              onChange={(e) => {
                const url = new URL(window.location.href)
                url.searchParams.set('isActive', e.target.value)
                window.location.href = url.toString()
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Total: {banners.length} banners
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Devices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                    {banner.subtitle && (
                      <div className="text-sm text-gray-500">{banner.subtitle}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {BANNER_LOCATION_LABELS[banner.location as keyof typeof BANNER_LOCATION_LABELS]}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {banner.order}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatSchedule(banner.startAt, banner.endAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                      {DEVICE_LABELS[banner.visibilityDevice as keyof typeof DEVICE_LABELS]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        banner.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(banner.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/banners/${banner.id}/edit`}
                      className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-900"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {banners.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <p className="mb-4">No banners found</p>
              <Link
                href="/admin/banners/new"
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700"
              >
                <Plus className="h-4 w-4" />
                Create your first banner
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
