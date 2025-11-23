import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { SubscriptionPlanForm } from '../../SubscriptionPlanForm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditSubscriptionPlanPage({ params }: PageProps) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = await params
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: parseInt(id) },
  })

  if (!plan) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Edit Subscription Plan</h1>
        <div className="rounded-lg bg-white p-8 shadow">
          <SubscriptionPlanForm plan={plan} />
        </div>
      </div>
    </div>
  )
}
