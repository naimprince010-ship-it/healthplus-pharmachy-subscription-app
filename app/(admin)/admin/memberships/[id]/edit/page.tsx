import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import MembershipForm from '@/components/admin/MembershipForm'
import { PageParams } from '@/types/page'

export const dynamic = 'force-dynamic'

type Params = {
  id: string
}

export default async function EditMembershipPage({
  params,
}: PageParams<Params>) {
  noStore()
  
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = await params

  const plan = await prisma.membershipPlan.findUnique({
    where: { id },
  })

  if (!plan) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Edit Membership Plan
        </h1>
        <MembershipForm plan={plan} />
      </div>
    </div>
  )
}
