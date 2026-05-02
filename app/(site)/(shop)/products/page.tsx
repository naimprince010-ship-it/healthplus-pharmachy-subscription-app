import { Suspense } from 'react'
import { MobileShopServer } from '@/components/MobileShopServer'
import { MAIN_CONTAINER_WITH_SIDEBAR } from '@/lib/layout'
import { ProductsContentClient } from './ProductsContentClient'

/** Avoid SSG that hits Prisma when DB is mid-migration; also keeps catalog fresh. */
export const dynamic = 'force-dynamic'

function ProductsDesktopSkeleton() {
  return (
    <div className="w-full bg-gray-50 py-6" aria-busy aria-label="পণ্য লোড হচ্ছে">
      <div className={`${MAIN_CONTAINER_WITH_SIDEBAR} animate-pulse`}>
        <aside className="hidden lg:block flex-shrink-0">
          <div className="sticky top-20 space-y-4 py-1">
            <div className="h-44 w-[240px] rounded-2xl bg-gray-200" />
          </div>
        </aside>
        <div className="min-w-0 px-2 sm:px-0">
          <div className="mb-6 h-10 max-w-md rounded-lg bg-gray-200" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="aspect-square w-full rounded-lg bg-gray-100" />
                <div className="mt-2 h-4 w-full rounded bg-gray-100" />
                <div className="mt-2 h-9 w-full rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <>
      {/* Desktop View - shows traditional product grid with filters */}
      <div className="hidden lg:block">
        <Suspense fallback={<ProductsDesktopSkeleton />}>
          <ProductsContentClient />
        </Suspense>
      </div>

      {/* Mobile View - shows products organized by sidebar categories (server-rendered for instant loading) */}
      <div className="block lg:hidden">
        <MobileShopServer />
      </div>
    </>
  )
}
