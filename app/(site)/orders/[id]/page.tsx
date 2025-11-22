'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function OrderConfirmationPage() {
  const params = useParams()

  return (
    <div className="bg-gray-50 py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Order Placed Successfully!</h1>
          <p className="mt-2 text-gray-600">
            Your order has been received and is being processed.
          </p>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="mt-1 font-mono text-lg font-semibold text-gray-900">{params.id}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700"
            >
              View My Orders
            </Link>
            <Link
              href="/medicines"
              className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
