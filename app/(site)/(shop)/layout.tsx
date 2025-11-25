import LeftCategorySidebar from '@/components/LeftCategorySidebar'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-white">
      {/* Full-bleed grid: sidebar flush to viewport, content in container */}
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
        {/* Left Sidebar - Desktop only, sticky positioned, flush to viewport */}
        <aside className="hidden lg:block">
          <div className="sticky top-16 w-[260px]">
            <LeftCategorySidebar />
          </div>
        </aside>
        
        {/* Main Content - wrapped in container */}
        <div className="min-w-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
