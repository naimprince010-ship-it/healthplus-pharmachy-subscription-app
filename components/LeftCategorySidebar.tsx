import Link from 'next/link'
import { ChevronRight, Zap } from 'lucide-react'
import { prisma } from '@/lib/prisma'

// Server component - fetches data on the server for instant loading
// No more client-side delay or "pop-in" effect
export default async function LeftCategorySidebar() {
  const categories = await prisma.category.findMany({
    where: {
      showInSidebar: true,
      isActive: true,
    },
    orderBy: {
      sidebarOrder: 'asc',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sidebarIconUrl: true,
      sidebarLinkUrl: true,
    },
  })

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
        <div className="divide-y divide-gray-50 bg-white">
          {categories.map((category) => {
            const href = category.sidebarLinkUrl || `/category/${category.slug}`

            return (
              <Link
                key={category.id}
                href={href}
                className="group flex items-center justify-between px-4 py-3.5 transition-all duration-200 hover:bg-teal-50/40 hover:pl-5"
              >
                <div className="flex items-center gap-3.5">
                  {category.sidebarIconUrl ? (
                    <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
                      <img
                        src={category.sidebarIconUrl}
                        alt={category.name}
                        className="h-full w-full object-cover p-0.5"
                      />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
                      <span className="text-sm font-bold uppercase">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-[15px] font-medium text-gray-700 transition-colors duration-200 group-hover:text-teal-700">
                    {category.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-teal-500" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
