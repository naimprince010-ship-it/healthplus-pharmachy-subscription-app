import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { OrderStatus } from '@prisma/client'
import OrdersStatusFilter from '@/components/admin/OrdersStatusFilter'

export const dynamic = 'force-dynamic'

const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  noStore()
  
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const rawStatus = searchParams.status?.toString().toUpperCase()
  const statusFilter = rawStatus && rawStatus !== 'ALL' && validStatuses.includes(rawStatus as OrderStatus) 
    ? (rawStatus as OrderStatus) 
    : undefined

  const orders = await prisma.order.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, phone: true },
      },
      items: {
        include: { medicine: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <div className="text-sm text-gray-600">
            Total: {orders.length} orders
          </div>
        </div>

        <OrdersStatusFilter />

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                    <div className="text-sm text-gray-500">{order.user.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {order.items.length} items
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ৳{order.total.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        order.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : order.status === 'SHIPPED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No orders found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
