import Link from 'next/link'

export default function CartPage() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-center py-12">
                <p className="text-gray-600">Your cart is empty</p>
                <Link
                  href="/medicines"
                  className="mt-4 inline-block rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">৳0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membership Discount (10%)</span>
                  <span className="font-semibold text-green-600">-৳0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charge</span>
                  <span className="font-semibold text-gray-900">৳0</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">৳0</span>
                  </div>
                </div>
              </div>
              <button
                disabled
                className="mt-6 w-full rounded-lg bg-gray-400 py-3 font-semibold text-white cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
