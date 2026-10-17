import { Suspense } from 'react'
import LeftCategorySidebar from '@/components/LeftCategorySidebar'
import LeftCategorySidebarSkeleton from '@/components/LeftCategorySidebarSkeleton'
import CategoryIconNav from '@/components/CategoryIconNav'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white">
      <Suspense fallback={null}>
        <CategoryIconNav />
      </Suspense>
      <div className="mx-auto w-full max-w-[1320px] px-3 sm:px-4 md:px-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
        {/* Left Sidebar streams independently so main column is not blocked by sidebar DB work */}
        <aside className="scrollbar-hide relative z-[30] hidden max-h-[calc(100vh-140px)] self-start overflow-y-auto lg:sticky lg:top-[124px] lg:block">
          <div className="w-[220px] py-4">
            <Suspense fallback={<LeftCategorySidebarSkeleton />}>
              <LeftCategorySidebar />
            </Suspense>
          </div>
        </aside>

        {/* Main Content - fluid width */}
        <div className="min-w-0 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
