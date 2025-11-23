'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteMembershipButtonProps {
  planId: string
  planName: string
  membershipCount: number
}

export default function DeleteMembershipButton({
  planId,
  planName,
  membershipCount,
}: DeleteMembershipButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/memberships/${planId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete membership plan')
        setIsDeleting(false)
        return
      }

      router.refresh()
      setShowConfirm(false)
    } catch (err) {
      console.error('Error deleting membership plan:', err)
      setError('Failed to delete membership plan')
      setIsDeleting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900">
            Delete Membership Plan
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to delete <strong>{planName}</strong>?
          </p>

          {membershipCount > 0 && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This plan has {membershipCount} user
                {membershipCount === 1 ? '' : 's'} who purchased it. Deletion
                will fail. Consider setting the plan to inactive instead.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                setShowConfirm(false)
                setError('')
              }}
              disabled={isDeleting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-700"
      title="Delete membership plan"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
