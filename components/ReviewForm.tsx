'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { RatingStars } from './RatingStars'
import { Loader2 } from 'lucide-react'

interface ReviewFormProps {
  productId: string
  onReviewSubmitted?: () => void
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { data: session, status } = useSession()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">রিভিউ দিতে লগইন করুন</p>
        <button
          type="button"
          onClick={() => window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          লগইন করুন
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-700 font-medium">আপনার রিভিউ সফলভাবে জমা হয়েছে!</p>
        <p className="text-green-600 text-sm mt-1">ধন্যবাদ আপনার মতামত জানানোর জন্য।</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('অনুগ্রহ করে রেটিং দিন')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'রিভিউ জমা দিতে সমস্যা হয়েছে')
      }

      setSuccess(true)
      setRating(0)
      setTitle('')
      setComment('')
      onReviewSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'রিভিউ জমা দিতে সমস্যা হয়েছে')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          আপনার রেটিং <span className="text-red-500">*</span>
        </label>
        <RatingStars
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
      </div>

      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">
          শিরোনাম (ঐচ্ছিক)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="আপনার রিভিউর শিরোনাম"
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">
          আপনার মতামত (ঐচ্ছিক)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          placeholder="এই পণ্য সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন..."
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            জমা হচ্ছে...
          </>
        ) : (
          'রিভিউ জমা দিন'
        )}
      </button>
    </form>
  )
}
