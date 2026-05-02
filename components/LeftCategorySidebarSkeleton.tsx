/** Lightweight placeholder while category sidebar streams (keeps shop layout responsive). */
export default function LeftCategorySidebarSkeleton() {
  return (
    <div className="w-[240px] animate-pulse space-y-4 py-1" aria-hidden>
      <div className="h-44 rounded-2xl bg-gray-100" />
      <div className="h-52 rounded-2xl bg-gray-100" />
    </div>
  )
}
