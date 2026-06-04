import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { ReturnRequestStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const validStatuses: ReturnRequestStatus[] = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'CLOSED']

function statusBadge(status: ReturnRequestStatus): string {
  if (status === 'CLOSED') return 'bg-gray-100 text-gray-800'
  if (status === 'REJECTED') return 'bg-red-100 text-red-800'
  if (status === 'APPROVED') return 'bg-blue-100 text-blue-800'
  if (status === 'RECEIVED') return 'bg-purple-100 text-purple-800'
  return 'bg-yellow-100 text-yellow-800'
}

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  noStore()

  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { status, q } = await searchParams
  const query = q?.trim() || ''
  const rawStatus = status?.toString().toUpperCase()
  const statusFilter =
    rawStatus && rawStatus !== 'ALL' && validStatuses.includes(rawStatus as ReturnRequestStatus)
      ? (rawStatus as ReturnRequestStatus)
      : undefined

  const whereClause: {
    status?: ReturnRequestStatus
    OR?: Array<
      | { id: { contains: string; mode: 'insensitive' } }
      | { order: { orderNumber: { contains: string; mode: 'insensitive' } } }
      | { user: { phone: { contains: string; mode: 'insensitive' } } }
    >
  } = {}

  if (statusFilter) {
    whereClause.status = statusFilter
  }

  if (query) {
    whereClause.OR = [
      { id: { contains: query, mode: 'insensitive' } },
      { order: { orderNumber: { contains: query, mode: 'insensitive' } } },
      { user: { phone: { contains: query, mode: 'insensitive' } } },
    ]
  }

  const returns = await prisma.returnRequest.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      order: {
        select: { id: true, orderNumber: true, total: true },
      },
      user: {
        select: { id: true, name: true, phone: true },
      },
      items: {
        select: { id: true, quantity: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
          <div className="text-sm text-gray-600">Total: {returns.length} requests</div>
        </div>

        <form method="GET" className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by return ID, order number, or phone"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <button
              type="submit"
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={query ? `/admin/returns?q=${encodeURIComponent(query)}` : '/admin/returns'}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              !statusFilter ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </Link>
          {validStatuses.map((item) => (
            <Link
              key={item}
              href={`/admin/returns?status=${item}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                statusFilter === item ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Return ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {returns.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{item.id.slice(0, 8)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link href={`/admin/orders/${item.order.id}`} className="text-teal-600 hover:text-teal-700">
                      #{item.order.orderNumber}
                    </Link>
                    <div className="text-xs text-gray-500">৳{item.order.total.toFixed(2)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.user.name}</div>
                    <div className="text-sm text-gray-500">{item.user.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{item.reason}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{item.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(item.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link href={`/admin/returns/${item.id}`} className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700">
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {returns.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              {statusFilter
                ? `No return requests with ${statusFilter} status`
                : query
                ? 'No return requests match your search'
                : 'No return requests found'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
