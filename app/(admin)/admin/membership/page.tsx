import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  noStore()
  
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const plans = await prisma.membershipPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { memberships: true },
      },
    },
  })

  const activeMemberships = await prisma.userMembership.count({
    where: {
      isActive: true,
      endDate: {
        gte: new Date(),
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Membership Plans</h1>
          <div className="text-sm text-gray-600">
            Active Memberships: {activeMemberships}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-gray-900">৳{plan.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{plan.durationDays} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-gray-900">{plan.discountPercent}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Purchases:</span>
                  <span className="font-medium text-gray-900">{plan._count.memberships}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    plan.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center text-gray-500 shadow">
            No membership plans found
          </div>
        )}
      </div>
    </div>
  )
}
