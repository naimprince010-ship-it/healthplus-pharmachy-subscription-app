import LeftCategorySidebar from '@/components/LeftCategorySidebar'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-white">
      {/* Full-width grid that wraps both sidebar and content - they zoom together as a unit */}
      <div className="w-full lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-4">
        {/* Left Sidebar - Desktop only, sticky positioned */}
        <aside className="hidden lg:block">
          <div className="sticky top-16 w-[260px]">
            <LeftCategorySidebar />
          </div>
        </aside>
        
        {/* Main Content */}
        <div className="min-w-0 px-4 sm:px-6 lg:px-0">
          {children}
        </div>
      </div>
    </div>
  )
}
