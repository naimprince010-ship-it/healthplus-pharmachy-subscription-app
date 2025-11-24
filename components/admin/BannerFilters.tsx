'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function BannerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const locationFilter = searchParams.get('location') || 'all'
  const isActiveFilter = searchParams.get('isActive') || 'all'

  const handleLocationChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('location', value)
    router.push(`/admin/banners?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('isActive', value)
    router.push(`/admin/banners?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex gap-4 rounded-lg bg-white p-4 shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <select
          value={locationFilter}
          onChange={(e) => handleLocationChange(e.target.value)}
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
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>
  )
}
