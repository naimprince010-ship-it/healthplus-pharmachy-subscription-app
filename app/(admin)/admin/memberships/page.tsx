import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { Edit, Plus } from 'lucide-react'
import DeleteMembershipButton from '@/components/admin/DeleteMembershipButton'

export const dynamic = 'force-dynamic'

export default async function MembershipsPage() {
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Membership Plans</h1>
            <p className="mt-2 text-sm text-gray-600">
              Active Memberships: {activeMemberships}
            </p>
          </div>
          <Link
            href="/admin/memberships/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Membership Plan
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Plan Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Purchases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {plan.name}
                    </div>
                    {plan.description && (
                      <div className="text-sm text-gray-500">
                        {plan.description}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ৳{plan.price.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {plan.durationDays} days
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {plan.discountPercent}%
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {plan._count.memberships}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        plan.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/memberships/${plan.id}/edit`}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <DeleteMembershipButton
                        planId={plan.id}
                        planName={plan.name}
                        membershipCount={plan._count.memberships}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {plans.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No membership plans yet. Create your first plan to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
