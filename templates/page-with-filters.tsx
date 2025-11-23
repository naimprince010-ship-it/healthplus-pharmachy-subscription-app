/**
 * TEMPLATE: List Page with Filters (searchParams)
 * 
 * Use this template when creating list pages that accept query parameters for filtering.
 * Copy this file and modify it for your specific use case.
 * 
 * Example pages using this pattern:
 * - app/(admin)/admin/orders/page.tsx
 * - app/(admin)/admin/categories/page.tsx
 * - app/(site)/medicines/page.tsx
 */

import { PageSearchParams } from '@/types/page'
import { unstable_noStore as noStore } from 'next/cache'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

type SearchParams = {
  search?: string
  status?: string
}

export default async function ListPage({
  searchParams,
}: PageSearchParams<SearchParams>) {
  noStore()

  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const params = await searchParams
  const search = params.search || ''
  const status = params.status?.toUpperCase() || 'ALL'


  return (
    <div>
      <h1>List Page</h1>
      {/* Render your list and filters */}
    </div>
  )
}
