'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'

interface BannerActionsProps {
  id: string
  title: string
  isActive: boolean
}

export function BannerActions({ id, title, isActive }: BannerActionsProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'toggle' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleActive = async () => {
    setPendingAction('toggle')
    setError(null)

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to update banner')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update banner')
    } finally {
      setPendingAction(null)
    }
  }

  const deleteBanner = async () => {
    if (!window.confirm(`Delete banner “${title}”? This cannot be undone.`)) return

    setPendingAction('delete')
    setError(null)

    try {
      const response = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to delete banner')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to delete banner')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${title}`}
          disabled={pendingAction !== null}
          onClick={toggleActive}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 ${isActive ? 'bg-teal-600' : 'bg-gray-300'}`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
        <Link
          href={`/admin/banners/${id}/edit`}
          className="inline-flex min-h-11 items-center gap-1 text-teal-600 hover:text-teal-900"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Link>
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={deleteBanner}
          className="inline-flex min-h-11 items-center gap-1 text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
      {error ? <p className="max-w-xs text-right text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
