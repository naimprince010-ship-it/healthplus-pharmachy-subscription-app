import LeftCategorySidebar from '@/components/LeftCategorySidebar'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
          {/* Left Sidebar - Desktop only, sticky positioned */}
          <div className="hidden lg:block">
            <div className="sticky top-20 w-full">
              <LeftCategorySidebar />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
