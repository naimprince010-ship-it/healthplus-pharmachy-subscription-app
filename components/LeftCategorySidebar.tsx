'use client'

import Link from 'next/link'
import { ChevronRight, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface SidebarCategory {
  id: string
  name: string
  slug: string
  sidebarIconUrl: string | null
}

export default function LeftCategorySidebar() {
  const [categories, setCategories] = useState<SidebarCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSidebarCategories()
  }, [])

  const fetchSidebarCategories = async () => {
    try {
      const res = await fetch('/api/sidebar-categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch sidebar categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="w-full">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* FLASH SALE Row */}
        <Link
          href="/flash-sale"
          className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-3 transition-all hover:from-orange-100 hover:to-red-100 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="font-semibold text-gray-900">FLASH SALE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
              1000+
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </Link>

        {/* Category List */}
        <div className="divide-y divide-gray-100">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/medicines?categoryId=${category.id}`}
              className="flex items-center justify-between px-4 py-3 transition-all hover:bg-gray-50 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                {category.sidebarIconUrl ? (
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                    <img
                      src={category.sidebarIconUrl}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                    <span className="text-xs font-semibold text-teal-600">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {category.name}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
