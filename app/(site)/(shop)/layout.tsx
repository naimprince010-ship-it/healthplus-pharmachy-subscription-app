import LeftCategorySidebar from '@/components/LeftCategorySidebar'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white">
      {/* Full-width on desktop with minimal padding (16-24px) - like MedEasy */}
      {/* Mobile/tablet: max-w-[1400px] centered, Desktop: full width with small padding */}
      <div className="mx-auto w-full max-w-[1400px] px-2 sm:px-4 lg:max-w-none lg:px-4 xl:px-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-4">
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
