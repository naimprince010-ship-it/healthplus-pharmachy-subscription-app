import { MAIN_CONTAINER } from '@/lib/layout'

/** Shown immediately on client navigations between `(site)` routes while the next page loads. */
export default function SiteLoading() {
  return (
    <div className="min-h-[40vh] bg-gray-50 py-8" aria-busy aria-label="পেজ লোড হচ্ছে">
      <div className={`${MAIN_CONTAINER} animate-pulse`}>
        <div className="h-9 w-56 max-w-full rounded-lg bg-gray-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="aspect-square w-full rounded-lg bg-gray-100" />
              <div className="mt-3 h-4 w-4/5 rounded bg-gray-100" />
              <div className="mt-2 h-3 w-2/5 rounded bg-gray-100" />
              <div className="mt-4 h-9 w-full rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
