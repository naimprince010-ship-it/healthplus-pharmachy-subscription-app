/**
 * TEMPLATE: Dynamic Route Page (params)
 * 
 * Use this template when creating pages with dynamic route segments like [id] or [slug].
 * Copy this file and modify it for your specific use case.
 * 
 * Example pages using this pattern:
 * - app/(admin)/admin/categories/[id]/edit/page.tsx
 * - app/(site)/medicines/[slug]/page.tsx
 * - app/(admin)/admin/orders/[id]/page.tsx
 */

import { PageParams } from '@/types/page'
import { unstable_noStore as noStore } from 'next/cache'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Params = {
  id: string // or slug: string, etc.
}

export async function generateMetadata({
  params,
}: PageParams<Params>): Promise<Metadata> {
  const { id } = await params


  return {
    title: `Item ${id}`,
  }
}

export default async function DetailPage({
  params,
}: PageParams<Params>) {
  noStore()

  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = await params



  return (
    <div>
      <h1>Detail Page for {id}</h1>
      {/* Render your detail view */}
    </div>
  )
}
