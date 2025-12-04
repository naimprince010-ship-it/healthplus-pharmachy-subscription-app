import DashboardPageClient from './DashboardPageClient'

// Route segment config - must be in a server component (not 'use client')
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DashboardPage() {
  return <DashboardPageClient />
}
