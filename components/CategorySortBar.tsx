'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

export function CategorySortBar({ totalItems, label = 'items' }: { totalItems: number, label?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get('sort') || 'default'

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === 'default') {
      params.delete('sort')
    } else {
      params.set('sort', e.target.value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between mt-4 bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-100 shadow-sm">
      <div className="text-sm text-gray-600 font-semibold px-2">
        {totalItems} {label}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="mobile-sort" className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Sort:</span>
        </label>
        <select
          id="mobile-sort"
          value={currentSort}
          onChange={handleSortChange}
          className="text-sm bg-white border border-gray-200 rounded-lg py-1.5 px-3 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm cursor-pointer"
        >
          <option value="default">Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
    </div>
  )
}
