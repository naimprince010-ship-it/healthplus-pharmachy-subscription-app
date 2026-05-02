import { Suspense } from 'react'
import { HomePageDeferred } from '@/components/HomePageDeferred'
import { HomePageSkeleton } from '@/components/HomePageSkeleton'

/** ISR: repeat visits get a cached shell; Suspense paints skeleton until DB resolves. */
export const revalidate = 60

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageDeferred />
    </Suspense>
  )
}
