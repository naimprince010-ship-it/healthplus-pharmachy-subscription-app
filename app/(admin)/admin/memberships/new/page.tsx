import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import MembershipForm from '@/components/admin/MembershipForm'

export const dynamic = 'force-dynamic'

export default async function NewMembershipPage() {
  noStore()
  
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Create Membership Plan
        </h1>
        <MembershipForm />
      </div>
    </div>
  )
}
