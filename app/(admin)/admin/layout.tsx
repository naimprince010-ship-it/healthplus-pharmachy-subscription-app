import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminLayoutWrapper } from '@/components/admin/AdminLayoutWrapper'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminLayoutWrapper userName={session.user.name ?? undefined} />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
