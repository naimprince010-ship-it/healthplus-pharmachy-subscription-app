'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const statusOptions = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function OrdersStatusFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = (searchParams.get('status') || 'ALL').toUpperCase()

  const handleStatusChange = (status: string) => {
    if (status === 'ALL') {
      router.push('/admin/orders')
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.set('status', status)
      router.push(`/admin/orders?${params.toString()}`)
    }
  }

  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Filter by status:</span>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentStatus === option.value
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
