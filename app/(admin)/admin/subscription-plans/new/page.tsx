import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SubscriptionPlanForm } from '../SubscriptionPlanForm'

export const dynamic = 'force-dynamic'

export default async function NewSubscriptionPlanPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Create Subscription Plan</h1>
        <div className="rounded-lg bg-white p-8 shadow">
          <SubscriptionPlanForm />
        </div>
      </div>
    </div>
  )
}
