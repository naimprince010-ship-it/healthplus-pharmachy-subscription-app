import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function CartPage() {
  const session = await getServerSession(authOptions)
  
  let cart = await prisma.cart.findUnique({
    where: { userId: session?.user?.id },
    include: {
      items: {
        include: {
          medicine: true
        }
      }
    }
  })

  const cartTotal = cart?.items.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0) || 0
  
  // Check for active membership for discount
  const activeMembership = await prisma.membership.findFirst({
    where: {
      userId: session?.user?.id,
      status: 'ACTIVE',
      endDate: {
        gte: new Date()
      }
    }
  })
  
  const discount = activeMembership ? (cartTotal * activeMembership.discount / 100) : 0
  const finalTotal = cartTotal - discount

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="mt-2 text-gray-600">
          Review your items and proceed to checkout.
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
            <Link href="/dashboard/cart" className="text-blue-600 border-b-2 border-blue-600 py-2 px-1 font-medium">
              Cart
            </Link>
            <Link href="/dashboard/orders" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Orders
            </Link>
            <Link href="/dashboard/profile" className="text-gray-500 hover:text-gray-700 py-2 px-1 font-medium">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {cart && cart.items.length > 0 ? (
            <div className="bg-white shadow rounded-lg">
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <li key={item.id} className="p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{item.medicine.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{item.medicine.description}</p>
                        <p className="mt-1 text-sm text-gray-500">Category: {item.medicine.category}</p>
                        <div className="mt-2">
                          <span className="text-sm text-gray-900">Quantity: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-semibold text-gray-900">৳{item.medicine.price * item.quantity}</p>
                        <p className="text-sm text-gray-500">৳{item.medicine.price} each</p>
                        <button className="mt-2 text-sm text-red-600 hover:text-red-700">
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-1 text-sm text-gray-500">Start adding some medicines to your cart.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Medicines
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">৳{cartTotal.toFixed(2)}</span>
              </div>
              
              {activeMembership && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Membership Discount ({activeMembership.discount}%)</span>
                  <span className="text-green-600">-৳{discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-base font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">৳{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {!activeMembership && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700">
                  💡 Get a membership for 10% discount on all orders!
                </p>
              </div>
            )}

            <button
              disabled={!cart || cart.items.length === 0}
              className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
