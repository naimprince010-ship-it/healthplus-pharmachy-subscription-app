import LeftCategorySidebar from '@/components/LeftCategorySidebar'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white">
      {/* Centered container with max-width - sidebar and content zoom together */}
      <div className="mx-auto w-full max-w-[1400px] px-2 sm:px-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-3 lg:px-4">
        {/* Left Sidebar - Desktop only, sticky positioned */}
        <aside className="hidden lg:block">
          <div className="sticky top-16 w-[220px] py-2">
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
