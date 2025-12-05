'use client'

import { useState } from 'react'
import { ReviewForm } from './ReviewForm'
import { ReviewList } from './ReviewList'

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleReviewSubmitted = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">রিভিউ ও রেটিং</h2>
        <ReviewList productId={productId} refreshTrigger={refreshTrigger} />
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">আপনার রিভিউ দিন</h3>
        <ReviewForm productId={productId} onReviewSubmitted={handleReviewSubmitted} />
      </div>
    </div>
  )
}
