import LeftCategorySidebar from '@/components/LeftCategorySidebar'
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
        {/* Left Sidebar - Desktop only, sticky positioned */}
        <aside className="hidden lg:block">
          <div className="sticky top-16 w-[240px] py-2">
            <LeftCategorySidebar />
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
