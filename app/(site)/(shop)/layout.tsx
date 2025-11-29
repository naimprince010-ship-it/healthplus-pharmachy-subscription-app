import LeftCategorySidebar from '@/components/LeftCategorySidebar'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white">
      {/* Centered container wrapping sidebar + content - like MedEasy */}
      {/* Up to 1536px: centered with max-w-[1480px] */}
      {/* 2xl (≥1536px): stretch to full width with 32px padding for large monitors */}
      <div className="mx-auto w-full max-w-[1480px] 2xl:max-w-none px-2 sm:px-4 lg:px-6 2xl:px-8 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-4">
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
