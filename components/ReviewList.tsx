'use client'

import { useState, useEffect, useCallback } from 'react'
import { RatingStars } from './RatingStars'
import { Loader2, CheckCircle, ThumbsUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { bn } from 'date-fns/locale'

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  isVerifiedPurchase: boolean
  helpfulCount: number
  notHelpfulCount: number
  createdAt: string
  user: {
    id: string
    name: string | null
  }
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  distribution: Record<number, number>
}

interface ReviewListProps {
  productId: string
  refreshTrigger?: number
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'rating' | 'helpfulCount'>('createdAt')

  const fetchReviews = useCallback(async (pageNum: number, sort: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/reviews?productId=${productId}&page=${pageNum}&limit=10&sortBy=${sort}&sortOrder=desc`
      )
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews(page, sortBy)
  }, [page, sortBy, refreshTrigger, fetchReviews])

  if (isLoading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="text-center md:text-left">
              <div className="text-4xl font-bold text-gray-900">
                {stats.averageRating.toFixed(1)}
              </div>
              <RatingStars rating={stats.averageRating} size="md" className="justify-center md:justify-start mt-1" />
              <div className="text-sm text-gray-500 mt-1">
                {stats.totalReviews} টি রিভিউ
              </div>
            </div>

            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star] || 0
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-8">{star} ★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">সব রিভিউ</h3>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as typeof sortBy)
              setPage(1)
            }}
            className="text-sm border rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="createdAt">সাম্প্রতিক</option>
            <option value="rating">রেটিং</option>
            <option value="helpfulCount">সহায়ক</option>
          </select>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={review.rating} size="sm" />
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        যাচাইকৃত ক্রয়
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-gray-900 mt-2">{review.title}</h4>
                  )}
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-600 mt-2 text-sm">{review.comment}</p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">{review.user.name || 'বেনামী'}</span>
                  <span className="mx-1">•</span>
                  <span>
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                      locale: bn,
                    })}
                  </span>
                </div>

                {review.helpfulCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{review.helpfulCount} জন সহায়ক মনে করেছেন</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            আগের
          </button>
          <span className="text-sm text-gray-600">
            পৃষ্ঠা {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            পরের
          </button>
        </div>
      )}
    </div>
  )
}
