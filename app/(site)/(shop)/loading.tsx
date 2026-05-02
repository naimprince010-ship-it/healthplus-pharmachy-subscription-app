import { MAIN_CONTAINER_WITH_SIDEBAR } from '@/lib/layout'

/** Shop shell skeleton: sidebar column + main grid while RSC payload prepares. */
export default function ShopLoading() {
  return (
    <div className="w-full bg-white py-6" aria-busy aria-label="শপ লোড হচ্ছে">
      <div className={`${MAIN_CONTAINER_WITH_SIDEBAR} animate-pulse`}>
        <aside className="hidden lg:block flex-shrink-0">
          <div className="sticky top-20 space-y-4 py-1">
            <div className="h-44 w-[240px] rounded-2xl bg-gray-100" />
            <div className="h-52 w-[240px] rounded-2xl bg-gray-100" />
          </div>
        </aside>
        <div className="min-w-0 px-2 sm:px-0">
          <div className="mb-6 h-10 w-72 max-w-full rounded-lg bg-gray-100" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="aspect-square w-full rounded-lg bg-gray-100" />
                <div className="mt-2 h-3 w-full rounded bg-gray-100" />
                <div className="mt-2 h-3 w-3/5 rounded bg-gray-100" />
                <div className="mt-3 h-9 w-full rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
