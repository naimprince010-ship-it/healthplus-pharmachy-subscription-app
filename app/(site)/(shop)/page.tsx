import { Suspense } from 'react'
import { HomePageDeferred } from '@/components/HomePageDeferred'
import { HomePageSkeleton } from '@/components/HomePageSkeleton'

/** Database-backed home data is resolved per request; this avoids DB access during builds. */
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageDeferred />
    </Suspense>
  )
}
