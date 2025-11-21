import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  
  const orders = await prisma.order.findMany({
    where: { userId: session?.user?.id },
    include: {
      items: {
        include: {
          medicine: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="mt-2 text-gray-600">
          View and track all your orders.
        </p>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm rounded-lg mb-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4 overflow-x-auto">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Dashboard
            </Link>
            <Link href="/dashboard/subscriptions" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Subscriptions
            </Link>
            <Link href="/dashboard/cart" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Cart
            </Link>
            <Link href="/dashboard/orders" className="text-blue-600 border-b-2 border-blue-600 py-2 px-1 font-medium">
              Orders
            </Link>
            <Link href="/dashboard/profile" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Order ID: {order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <ul className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-4 flex">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.medicine.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">৳{item.price * item.quantity}</p>
                        <p className="text-sm text-gray-500">৳{item.price} each</p>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">৳{order.total.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-green-600">Discount</span>
                      <span className="text-green-600">-৳{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-medium mt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">৳{order.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start shopping to see your order history here.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/cart"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
