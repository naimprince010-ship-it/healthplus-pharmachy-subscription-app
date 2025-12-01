import { Suspense } from 'react'
import { MobileShopServer } from '@/components/MobileShopServer'
import { ProductsContentClient } from './ProductsContentClient'

export default async function ProductsPage() {
  return (
    <>
      {/* Desktop View - shows traditional product grid with filters */}
      <div className="hidden lg:block">
        <Suspense fallback={
          <div className="bg-gray-50 py-8">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading products...</div>
              </div>
            </div>
          </div>
        }>
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
