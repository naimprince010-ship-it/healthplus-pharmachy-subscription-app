import { Suspense } from 'react'
import LeftCategorySidebar from '@/components/LeftCategorySidebar'
import LeftCategorySidebarSkeleton from '@/components/LeftCategorySidebarSkeleton'
import { MAIN_CONTAINER_WITH_SIDEBAR } from '@/lib/layout'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white">
      {/* Centered container wrapping sidebar + content - like MedEasy */}
      {/* Uses shared MAIN_CONTAINER_WITH_SIDEBAR for consistent layout across all pages */}
      <div className={MAIN_CONTAINER_WITH_SIDEBAR}>
        {/* Left Sidebar streams independently so main column is not blocked by sidebar DB work */}
        <aside className="hidden lg:block flex-shrink-0 relative z-[30]">
          <div className="sticky top-20 w-[240px] py-1 h-[calc(100vh-5rem)] overflow-y-auto scrollbar-hide">
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
