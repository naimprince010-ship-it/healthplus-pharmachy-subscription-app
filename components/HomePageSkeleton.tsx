import { MAIN_CONTAINER } from '@/lib/layout'

/** Shown instantly while `/` home catalog data resolves (paired with Suspense around HomePageDeferred). */
export function HomePageSkeleton() {
  return (
    <div className="min-h-[60vh]" aria-busy aria-label="হোম লোড হচ্ছে">
      {/* Hero-ish block */}
      <div className="relative min-h-[200px] animate-pulse bg-gradient-to-br from-teal-800 to-teal-700 sm:min-h-[240px]" />
      <div className={`${MAIN_CONTAINER} animate-pulse py-4 lg:py-6`}>
        <div className="mb-4 flex justify-between gap-4">
          <div className="h-7 w-40 rounded-lg bg-gray-200" />
          <div className="h-6 w-24 rounded bg-gray-100" />
        </div>
        <div className="flex gap-3 overflow-hidden pb-2 lg:grid lg:grid-cols-5 lg:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0 lg:w-auto">
              <div className="aspect-[4/3] rounded-xl bg-gray-100" />
              <div className="mt-2 h-3 w-full rounded bg-gray-100" />
              <div className="mt-1 h-3 w-2/3 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="mt-8 h-6 w-48 rounded-lg bg-gray-200" />
        <div className="mt-3 flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0">
              <div className="aspect-[4/3] rounded-xl bg-gray-100" />
              <div className="mt-2 h-3 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
